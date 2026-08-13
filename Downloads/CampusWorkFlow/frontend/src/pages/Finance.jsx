import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import api from "../api/client.js";

const EXPENSES = [
  { cat: "Masse Salariale Enseignants", amount: "128 400 XAF", pct: 68 },
  { cat: "Infrastructure & Campus", amount: "28 900 XAF", pct: 16 },
  { cat: "Équipements & Laboratoires", amount: "18 200 XAF", pct: 10 },
  { cat: "Logiciels & Services Cloud", amount: "8 900 XAF", pct: 6 },
];

export default function Finance() {
  const { user } = useAuth();
  const { invoices, loading, errors } = useData();

  const [modalInv, setModalInv] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Champs formulaire alignés avec InvoiceCreate du service finance
  const [idStudent, setIdStudent] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [lineDesc, setLineDesc] = useState("Frais de scolarité Semestre 2");
  const [lineQty, setLineQty] = useState(1);
  const [linePrix, setLinePrix] = useState("");

  const resetForm = () => {
    setIdStudent("");
    setDateEcheance("");
    setLineDesc("Frais de scolarité Semestre 2");
    setLineQty(1);
    setLinePrix("");
    setFormError("");
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!idStudent || !dateEcheance || !linePrix) {
      setFormError("Tous les champs obligatoires (*) doivent être remplis.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/finance/invoices", {
        id_student: parseInt(idStudent, 10),
        date_echeance: dateEcheance,
        lignes: [
          {
            description: lineDesc,
            quantite: parseInt(lineQty, 10),
            prix_unitaire: parseFloat(linePrix),
          },
        ],
      });
      // Mettre à jour la liste locale
      resetForm();
      setModalInv(false);
      setToastMsg(`Facture ${res.data.numero_facture || ""} émise avec succès.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Impossible de créer la facture.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (inv) => {
    const id = inv.id_invoice || inv.id;
    const ref = inv.numero_facture || `FAC-${id}`;
    try {
      // Initier un paiement en espèces (ESPECES) pour marquer comme payée
      await api.post("/finance/payments/momo/initiate", {
        id_invoice: id,
        montant: inv.montant_total || inv.amount,
        methode: "MTN_MOMO",
        numero_telephone: "000000000",
      });
      setToastMsg(`Facture ${ref} marquée comme payée.`);
      setToastShow(true);
    } catch (err) {
      setToastMsg(err.response?.data?.detail || "Erreur lors du paiement.");
      setToastShow(true);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Finance" }, { label: "Dashboard" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} radius={12} />)}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  const pendingCount = invoices.filter(
    (i) => i.statut !== "PAYEE" && i.status !== "Payée"
  ).length;

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Finance" }, { label: "Dashboard" }]} />

      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Gestion Financière & Comptabilité</h2>
            <span className="role-pill finance">Finance</span>
          </div>
          <p className="muted">Suivi des encaissements, factures de scolarité et budgets.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => { resetForm(); setModalInv(true); }}>
            + Émettre une Facture
          </button>
        </div>
      </div>

      {errors.invoices && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>
          ⚠️ {errors.invoices}
        </div>
      )}

      <div className="grid stats">
        <StatCard label="Factures Totales" value={invoices.length} trend="Tous statuts" mark="💶" />
        <StatCard label="Factures en Attente" value={pendingCount} trend="À recouvrer" mark="🧾" down={pendingCount > 0} />
        <StatCard label="Taux de Recouvrement" value={
          invoices.length > 0
            ? `${Math.round(((invoices.length - pendingCount) / invoices.length) * 100)}%`
            : "—"
        } trend="Factures payées" mark="📈" />
        <StatCard label="Recettes" value="—" trend="Données en direct" mark="📊" />
      </div>

      <div className="grid two-cols" style={{ marginTop: 24 }}>
        <div className="panel card-interactive" style={{ padding: 20 }}>
          <div className="panel-head">
            <h3>Répartition des Dépenses</h3>
            <span className="badge info">Budget</span>
          </div>
          <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
            {EXPENSES.map((e) => (
              <div key={e.cat}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong>{e.cat}</strong>
                  <span className="muted">{e.amount}</span>
                </div>
                <div className="progress-bar-mini">
                  <div className="fill" style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel card-interactive" style={{ padding: 20 }}>
          <h3>Flux de Trésorerie Mensuel</h3>
          <div className="linechart" style={{ marginTop: 16 }}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" style={{ width: "100%", height: 140 }}>
              <polyline points="0,95 50,70 100,80 150,45 200,60 250,25 300,35" fill="none" stroke="var(--brand)" strokeWidth="3" />
              <polygon points="0,95 50,70 100,80 150,45 200,60 250,25 300,35 300,120 0,120" fill="rgba(249,115,22,0.15)" />
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span className="muted">Jan 2026</span>
            <span className="muted">Août 2026</span>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <h3>Registre des Factures</h3>
        <button className="btn ghost" onClick={() => { resetForm(); setModalInv(true); }}>+ Nouvelle facture</button>
      </div>

      <div className="panel table-wrap">
        {invoices.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Aucune facture"
            description="Les factures émises apparaîtront ici."
            action={<button className="btn primary" onClick={() => setModalInv(true)}>+ Émettre une facture</button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Étudiant (ID)</th>
                <th>Échéance</th>
                <th>Montant Total</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPaid = inv.statut === "PAYEE" || inv.status === "Payée";
                return (
                  <tr key={inv.id_invoice || inv.id} className="row-hover">
                    <td><code className="code-tag">{inv.numero_facture || inv.id}</code></td>
                    <td><strong>{inv.id_student || inv.studentName}</strong></td>
                    <td>{inv.date_echeance || inv.dueDate}</td>
                    <td><strong>{inv.montant_total || inv.amount} XAF</strong></td>
                    <td>
                      <Badge status={
                        isPaid ? "Validé"
                        : inv.statut === "EN_RETARD" || inv.status === "En retard" ? "Overdue"
                        : "Pending"
                      } />
                    </td>
                    <td>
                      {!isPaid ? (
                        <button className="btn primary sm" onClick={() => handleMarkPaid(inv)}>
                          Encaisser
                        </button>
                      ) : (
                        <span className="badge success">Encaissée</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Création Facture — aligné avec InvoiceCreate */}
      <Modal
        open={modalInv}
        title="Émettre une Facture"
        onClose={() => { setModalInv(false); resetForm(); }}
        footer={
          <>
            <button className="btn" onClick={() => { setModalInv(false); resetForm(); }}>Annuler</button>
            <button className="btn primary" onClick={handleCreateInvoice} disabled={submitting}>
              {submitting ? "Génération…" : "Générer la facture"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoice} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", color: "var(--danger)", fontSize: 13, background: "var(--danger-bg)", padding: "8px 12px", borderRadius: 6 }}>
              {formError}
            </div>
          )}
          <label className="full">
            ID Étudiant * <span className="muted" style={{ fontSize: 11 }}>(numérique, depuis le module académique)</span>
            <input
              type="number"
              className="field"
              value={idStudent}
              onChange={(e) => setIdStudent(e.target.value)}
              placeholder="Ex. 1"
              required
              min="1"
            />
          </label>
          <label className="full">
            Date d'échéance *
            <input
              type="date"
              className="field"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              required
            />
          </label>
          <label className="full">
            Description de la ligne *
            <input
              className="field"
              value={lineDesc}
              onChange={(e) => setLineDesc(e.target.value)}
              placeholder="Ex. Frais de scolarité Semestre 2"
              required
            />
          </label>
          <label>
            Quantité
            <input
              type="number"
              className="field"
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
              min="1"
              required
            />
          </label>
          <label>
            Prix unitaire (XAF) *
            <input
              type="number"
              className="field"
              value={linePrix}
              onChange={(e) => setLinePrix(e.target.value)}
              placeholder="Ex. 450000"
              required
              min="0"
            />
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Portail Finance" />
    </div>
  );
}
