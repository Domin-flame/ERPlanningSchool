import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

const CAMPAIGNS = [
  { name: "Recrutement Licence 2026", channel: "Réseaux Sociaux", budget: "8,500 €", leads: 320, status: "Active" },
  { name: "Journée Portes Ouvertes Virtuelle", channel: "Emailing Direct", budget: "3,200 €", leads: 148, status: "Active" },
  { name: "Campagne Bourses & Excellence", channel: "Google Search Ads", budget: "4,500 €", leads: 210, status: "Active" },
  { name: "Executive MBA & Formation Continue", channel: "LinkedIn Ads", budget: "6,000 €", leads: 96, status: "Pending" },
];

export default function MarketingDashboard() {
  const { user } = useAuth();
  const { leads, addLead, updateLeadStatus, loading } = useData();

  const [modalLead, setModalLead] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [newLeadName, setNewLeadName]       = useState("");
  const [newLeadContact, setNewLeadContact] = useState("");
  const [newLeadSource, setNewLeadSource]   = useState("Site Web");
  const [formError, setFormError]           = useState("");
  const [submitting, setSubmitting]         = useState(false);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!newLeadName || !newLeadContact) {
      setFormError("Nom et contact sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await addLead({
        nom: newLeadName,
        contact: newLeadContact,
        source: newLeadSource || null,
      });
      setNewLeadName("");
      setNewLeadContact("");
      setModalLead(false);
      setToastMsg(`Prospect ${newLeadName} ajouté à la base CRM.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Erreur lors de l'ajout du lead.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Marketing" }, { label: "Dashboard" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius={12} />
          ))}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Marketing" }, { label: "Dashboard" }]} />
      
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Marketing & Acquisition</h2>
            <span className="role-pill marketing">Marketing</span>
          </div>
          <p className="muted">Suivi des campagnes de recrutement, leads et taux de conversion.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setModalLead(true)}>
            + Nouveau Prospect / Lead
          </button>
        </div>
      </div>

      <div className="grid stats">
        <StatCard label="Campagnes Actives" value="6" trend="+2 ce mois" mark="📣" />
        <StatCard label="Prospects Générés" value={leads.length > 0 ? leads.length : "—"} trend={leads.length > 0 ? `${leads.length} leads en base` : "Aucun lead chargé"} mark="🎯" />
        <StatCard label="Taux de Conversion" value="28.4%" trend="+4.2% vs l'an dernier" mark="📈" />
        <StatCard label="Coût d'Acquisition" value="42 € / lead" trend="-6.5% d'économie" mark="€" />
      </div>

      {/* Leads CRM & Pipeline */}
      <div className="section-title" style={{ marginTop: 24 }}>
        <h3>Pipeline des Prospects (CRM Admissions)</h3>
        <button className="btn ghost" onClick={() => setModalLead(true)}>+ Ajouter un lead</button>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Identifiant</th>
              <th>Prospect</th>
              <th>Email / Tél</th>
              <th>Programme souhaité</th>
              <th>Canal d'Origine</th>
              <th>Score Lead</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id_lead || l.id} className="row-hover">
                <td><code className="code-tag">#{l.id_lead || l.id}</code></td>
                <td><strong>{l.nom || l.name}</strong></td>
                <td>{l.contact || l.email}<br /><small className="muted">{l.source}</small></td>
                <td><span className="badge info">{l.source || "—"}</span></td>
                <td>
                  <strong style={{ color: (l.score || 0) > 80 ? "var(--success)" : "var(--warning)" }}>
                    {l.score ? `${l.score} / 100` : "—"}
                  </strong>
                </td>
                <td>
                  <Badge status={
                    l.statut === "NOUVEAU"   || l.status === "Nouveau"   ? "Active"  :
                    l.statut === "CONVERTI"  || l.status === "Inscrit"   ? "Validé"  :
                    "Pending"
                  } />
                </td>
                <td>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      updateLeadStatus(l.id_lead || l.id, l.statut === "QUALIFIE" ? "CONVERTI" : "QUALIFIE");
                      setToastMsg(`Statut du prospect ${l.nom || l.name} mis à jour.`);
                      setToastShow(true);
                    }}
                  >
                    Avancer statut
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campagnes marketing table */}
      <div className="section-title" style={{ marginTop: 28 }}>
        <h3>Performance des Campagnes de Recrutement</h3>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom de la Campagne</th>
              <th>Canal d'Acquisition</th>
              <th>Budget Alloué</th>
              <th>Leads Générés</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map((c, i) => (
              <tr key={i}>
                <td><strong>{c.name}</strong></td>
                <td>{c.channel}</td>
                <td>{c.budget}</td>
                <td><strong>{c.leads} prospects</strong></td>
                <td><Badge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout Prospect */}
      <Modal
        open={modalLead}
        title="Ajouter un Prospect (Lead)"
        onClose={() => setModalLead(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalLead(false)}>Annuler</button>
            <button className="btn primary" onClick={handleCreateLead} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer le lead"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateLead} className="form-grid">
          {formError && (
            <div className="full" style={{ padding: "8px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6, fontSize: 13 }}>
              {formError}
            </div>
          )}
          <label className="full">
            Nom & Prénom *
            <input
              className="field"
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
              placeholder="Ex. Inès Khelifi"
              required
            />
          </label>
          <label className="full">
            Contact (email ou téléphone) *
            <input
              className="field"
              value={newLeadContact}
              onChange={(e) => setNewLeadContact(e.target.value)}
              placeholder="Ex. ines@gmail.com ou +237 6XX XXX XXX"
              required
            />
          </label>
          <label className="full">
            Source d'acquisition
            <select
              className="field"
              value={newLeadSource}
              onChange={(e) => setNewLeadSource(e.target.value)}
            >
              <option value="Site Web">Site Web</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Salon Étudiant">Salon Étudiant</option>
              <option value="Recommandation">Recommandation</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="CRM Marketing" />
    </div>
  );
}
