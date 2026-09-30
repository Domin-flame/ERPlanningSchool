import http, { asList, unwrap } from "./http.js";

export const financeApi = {
  invoices: () => unwrap(http.get("/finance/invoices")).then(asList),
  invoice: (id) => unwrap(http.get(`/finance/invoices/${id}`)),
  myInvoices: () => unwrap(http.get("/finance/students/me/invoices")).then(asList),
  /** payload: { id_student, date_echeance, lignes: [{ description, quantite, prix_unitaire }] } */
  createInvoice: (payload) => unwrap(http.post("/finance/invoices", payload)),
  setInvoiceStatus: (id, status) => unwrap(http.patch(`/finance/invoices/${id}`, { status })),
  /** payload: { id_invoice, montant, methode: MTN_MOMO|ORANGE_MONEY, numero_telephone } */
  initiateMomo: (payload) => unwrap(http.post("/finance/payments/momo/initiate", payload)),
  confirmMomo: (reference) => unwrap(http.post(`/finance/payments/momo/confirm/${reference}`)),
  payment: (reference) => unwrap(http.get(`/finance/payments/${reference}`)),
};

export const marketingApi = {
  leads: () => unwrap(http.get("/marketing/leads")).then(asList),
  /** payload: { nom, contact, source?, id_campaign? } */
  createLead: (payload) => unwrap(http.post("/marketing/leads", payload)),
  setLeadStatus: (id, status) => unwrap(http.patch(`/marketing/leads/${id}`, { status })),
  campaigns: () => unwrap(http.get("/marketing/campaigns")).then(asList),
  /** payload: { nom, canal, date_debut, date_fin?, budget } */
  createCampaign: (payload) => unwrap(http.post("/marketing/campaigns", payload)),
};
