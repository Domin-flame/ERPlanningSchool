import React, { useMemo, useState } from "react";
import { Ban, CheckCircle2, Eye, Plus, Receipt, Smartphone, Trash2 } from "lucide-react";
import {
  AsyncContent, Button, Card, ConfirmModal, DataTable, EmptyState, Field, FormError, FormGrid, IconButton, Input, Modal,
  PageHeader, SearchInput, Select, StatusBadge, Toolbar,
} from "../../components/ui";
import { financeApi } from "../../api/finance.js";
import { errorMessage } from "../../api/errors.js";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, formatMoney, isoDate, matchesQuery, sumBy } from "../../utils/format.js";
import { INVOICE_STATUS } from "../../utils/status.js";
import { isOpenInvoice, isOverdue, loadInvoicesWithStudents } from "./financeData.js";

const inThirtyDays = () => isoDate(new Date(Date.now() + 30 * 86400000));
const EMPTY_LINE = { description: "Frais de scolarité", quantite: 1, prix_unitaire: "" };

function InvoiceModal({ students, onClose, onSaved }) {
  const toast = useToast();
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState(inThirtyDays);
  const [lines, setLines] = useState([EMPTY_LINE]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const total = sumBy(lines, (l) => Number(l.quantite) * Number(l.prix_unitaire));

  const updateLine = (index, key, value) => setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [key]: value } : l)));

  const submit = async (event) => {
    event.preventDefault();
    if (!studentId) return setError("Sélectionnez un étudiant.");
    if (lines.some((l) => !l.description.trim() || !(Number(l.prix_unitaire) > 0) || !(Number(l.quantite) > 0))) {
      return setError("Chaque ligne doit avoir une description, une quantité et un prix unitaire positifs.");
    }
    setPending(true);
    setError("");
    try {
      await financeApi.createInvoice({
        id_student: Number(studentId),
        date_echeance: dueDate,
        lignes: lines.map((l) => ({ description: l.description.trim(), quantite: Number(l.quantite), prix_unitaire: Number(l.prix_unitaire) })),
      });
      toast.success("Facture émise.");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };

  return (
    <Modal open size="lg" title="Nouvelle facture" onClose={onClose}
      footer={<><span className="grow muted">Total : <strong>{formatMoney(total)}</strong></span><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="invoice-form" loading={pending}>Émettre</Button></>}>
      <form id="invoice-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Étudiant" required hint={students.length ? undefined : "Annuaire académique indisponible : saisissez l'identifiant étudiant."}>
            {students.length ? (
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Sélectionner…"
                options={students.map((s) => ({ value: s.id, label: `${s.name} (${s.matricule})` }))} />
            ) : (
              <Input type="number" min="1" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            )}
          </Field>
          <Field label="Échéance" required><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        </FormGrid>
        <div className="stack stack--sm">
          <strong>Lignes de facture</strong>
          {lines.map((line, index) => (
            <div className="invoice-line" key={index}>
              <Input aria-label="Description" placeholder="Description" value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
              <Input aria-label="Quantité" type="number" min="1" value={line.quantite} onChange={(e) => updateLine(index, "quantite", e.target.value)} />
              <Input aria-label="Prix unitaire" type="number" min="0" placeholder="Prix unitaire" value={line.prix_unitaire} onChange={(e) => updateLine(index, "prix_unitaire", e.target.value)} />
              <IconButton icon={Trash2} label="Retirer la ligne" size="sm" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))} />
            </div>
          ))}
          <div><Button size="sm" variant="ghost" icon={Plus} onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE, description: "" }])}>Ajouter une ligne</Button></div>
        </div>
      </form>
    </Modal>
  );
}

function InvoiceDetailModal({ invoice, studentName, onClose }) {
  const load = useMemo(() => () => financeApi.invoice(invoice.id_invoice), [invoice.id_invoice]);
  const { data, loading, error, reload } = useApi(load);
  const lines = data?.lignes || [];
  return (
    <Modal open size="lg" title={`Facture ${invoice.numero_facture}`} description={studentName} onClose={onClose}
      footer={<><Button variant="ghost" onClick={() => window.print()}>Imprimer</Button><Button onClick={onClose}>Fermer</Button></>}>
      <div className="stack">
        <dl className="details">
          <div><dt>Émise le</dt><dd>{formatDate(invoice.date_emission)}</dd></div>
          <div><dt>Échéance</dt><dd>{formatDate(invoice.date_echeance)}</dd></div>
          <div><dt>Statut</dt><dd><StatusBadge map={INVOICE_STATUS} value={invoice.statut} /></dd></div>
          <div><dt>Total</dt><dd><strong>{formatMoney(invoice.montant_total)}</strong></dd></div>
        </dl>
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!lines.length} empty={<EmptyState compact title="Aucune ligne" />}>
          <table className="table table--dense">
            <thead><tr><th>Description</th><th style={{ textAlign: "right" }}>Qté</th><th style={{ textAlign: "right" }}>Prix unitaire</th><th style={{ textAlign: "right" }}>Montant</th></tr></thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id_line}>
                  <td>{l.description}</td>
                  <td style={{ textAlign: "right" }}>{l.quantite}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(l.prix_unitaire)}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(l.montant ?? l.quantite * l.prix_unitaire)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AsyncContent>
      </div>
    </Modal>
  );
}

function MomoModal({ invoice, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ methode: "MTN_MOMO", numero_telephone: "", montant: String(invoice.montant_total ?? "") });
  const [pending, setPending] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  const initiate = async (event) => {
    event.preventDefault();
    if (!/^\+?\d{8,15}$/.test(form.numero_telephone.replace(/\s/g, ""))) return setError("Numéro de téléphone invalide.");
    setPending(true);
    setError("");
    try {
      const res = await financeApi.initiateMomo({
        id_invoice: invoice.id_invoice, methode: form.methode, numero_telephone: form.numero_telephone.replace(/\s/g, ""), montant: Number(form.montant),
      });
      setPayment(res?.payment || res);
      toast.info("Demande de paiement envoyée. Confirmation automatique sous quelques secondes.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };

  const confirmNow = async () => {
    setPending(true);
    try {
      await financeApi.confirmMomo(payment.reference);
      toast.success("Paiement confirmé.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
      onDone();
      onClose();
    }
  };

  return (
    <Modal open title="Paiement Mobile Money" description={`Facture ${invoice.numero_facture} — ${formatMoney(invoice.montant_total)}`}
      onClose={() => { if (payment) onDone(); onClose(); }}
      footer={payment ? (
        <><Button variant="ghost" onClick={() => { onDone(); onClose(); }}>Fermer</Button><Button loading={pending} onClick={confirmNow}>Confirmer maintenant</Button></>
      ) : (
        <><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="momo-form" loading={pending}>Initier le paiement</Button></>
      )}>
      {payment ? (
        <div className="stack">
          <p>Référence : <code>{payment.reference}</code></p>
          <p className="muted">Le client valide la demande sur son téléphone. La facture est mise à jour à la confirmation.</p>
        </div>
      ) : (
        <form id="momo-form" className="stack" onSubmit={initiate}>
          <FormError message={error} />
          <div className="segmented" role="radiogroup" aria-label="Opérateur">
            {[["MTN_MOMO", "MTN MoMo"], ["ORANGE_MONEY", "Orange Money"]].map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={form.methode === value}
                className={`segmented__option ${form.methode === value ? "is-active" : ""}`} onClick={() => setForm((p) => ({ ...p, methode: value }))}>{label}</button>
            ))}
          </div>
          <FormGrid>
            <Field label="Téléphone" required><Input inputMode="tel" placeholder="6XXXXXXXX" value={form.numero_telephone} onChange={(e) => setForm((p) => ({ ...p, numero_telephone: e.target.value }))} /></Field>
            <Field label="Montant (FCFA)" required><Input type="number" min="1" value={form.montant} onChange={(e) => setForm((p) => ({ ...p, montant: e.target.value }))} /></Field>
          </FormGrid>
        </form>
      )}
    </Modal>
  );
}

export default function InvoicesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(loadInvoicesWithStudents);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [busy, setBusy] = useState(null);

  const students = useMemo(() => data?.students || [], [data]);
  const names = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const invoices = useMemo(() => data?.invoices || [], [data]);
  const studentName = (i) => names.get(i.id_student) || `Étudiant #${i.id_student}`;

  const rows = useMemo(
    () => invoices.filter((i) => (!status || (status === "OVERDUE" ? isOverdue(i) : i.statut === status)) &&
      matchesQuery(query, i.numero_facture, names.get(i.id_student), String(i.id_student))),
    [invoices, status, query, names]
  );

  const setInvoiceStatus = async (invoice, value, message) => {
    setBusy(invoice.id_invoice);
    try {
      await financeApi.setInvoiceStatus(invoice.id_invoice, value);
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
      setToCancel(null);
    }
  };

  const columns = [
    { key: "numero_facture", header: "N° facture", render: (i) => <strong>{i.numero_facture}</strong> },
    { key: "student", header: "Étudiant", sortValue: studentName, render: studentName },
    { key: "date_emission", header: "Émise le", render: (i) => formatDate(i.date_emission) },
    { key: "date_echeance", header: "Échéance", render: (i) => <span className={isOverdue(i) ? "text-danger" : ""}>{formatDate(i.date_echeance)}</span> },
    { key: "montant_total", header: "Montant", align: "right", sortValue: (i) => Number(i.montant_total), render: (i) => formatMoney(i.montant_total) },
    { key: "statut", header: "Statut", render: (i) => <StatusBadge map={INVOICE_STATUS} value={i.statut} /> },
    { key: "actions", header: "", sortable: false, align: "right", render: (i) => (
      <div className="row row--end">
        <IconButton icon={Eye} label="Détail" size="sm" onClick={() => setModal({ type: "detail", invoice: i })} />
        {isOpenInvoice(i) && (
          <>
            <IconButton icon={Smartphone} label="Paiement Mobile Money" size="sm" onClick={() => setModal({ type: "momo", invoice: i })} />
            <IconButton icon={CheckCircle2} label="Marquer payée" size="sm" disabled={busy === i.id_invoice} onClick={() => setInvoiceStatus(i, "PAYEE", "Facture marquée comme payée.")} />
            <IconButton icon={Ban} label="Annuler" size="sm" disabled={busy === i.id_invoice} onClick={() => setToCancel(i)} />
          </>
        )}
      </div>
    ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Finance" title="Factures & encaissements" description="Émission des factures, paiements Mobile Money et suivi des impayés."
        actions={<Button icon={Plus} onClick={() => setModal({ type: "create" })}>Nouvelle facture</Button>} />
      <Card padded={false}>
        <Toolbar end={<span className="muted">{rows.length} facture(s) · {formatMoney(sumBy(rows, (i) => i.montant_total))}</span>}>
          <SearchInput value={query} onChange={setQuery} placeholder="N° facture ou étudiant…" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Tous les statuts" aria-label="Statut"
            options={[...Object.entries(INVOICE_STATUS).map(([value, meta]) => ({ value, label: meta.label })), { value: "OVERDUE", label: "Échéance dépassée" }]} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(i) => i.id_invoice} loading={loading} error={error} onRetry={reload}
          empty={<EmptyState icon={Receipt} title="Aucune facture" description="Les factures émises apparaîtront ici." />} />
      </Card>
      {modal?.type === "create" && <InvoiceModal students={students} onClose={() => setModal(null)} onSaved={reload} />}
      {modal?.type === "detail" && <InvoiceDetailModal invoice={modal.invoice} studentName={studentName(modal.invoice)} onClose={() => setModal(null)} />}
      {modal?.type === "momo" && <MomoModal invoice={modal.invoice} onClose={() => setModal(null)} onDone={reload} />}
      <ConfirmModal open={!!toCancel} title="Annuler cette facture ?" message={`La facture ${toCancel?.numero_facture} sera marquée comme annulée.`}
        confirmLabel="Annuler la facture" loading={!!busy} onConfirm={() => setInvoiceStatus(toCancel, "ANNULEE", "Facture annulée.")} onClose={() => setToCancel(null)} />
    </div>
  );
}
