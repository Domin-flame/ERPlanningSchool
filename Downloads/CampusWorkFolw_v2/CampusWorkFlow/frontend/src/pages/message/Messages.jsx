import React, { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/client.js";

function initials(value) {
  return (value || "??").substring(0, 2).toUpperCase();
}

export default function Messages() {
  const { conversations, errors, refreshData } = useData();
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [directory, setDirectory] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [newConversation, setNewConversation] = useState(false);
  const [creating, setCreating] = useState(false);
  const activeConv = conversations[active];

  useEffect(() => {
    api.get("/auth/directory")
      .then((res) => setDirectory(res.data || []))
      .catch((err) => setError(err.response?.data?.detail || "Impossible de charger l'annuaire."));
  }, []);

  const allowedRecipients = directory.filter((entry) => entry.id !== user?.id && (
    user?.role !== "student" || ["student", "professeur", "academic", "finance"].includes(entry.role)
  ));

  const createConversation = async (event) => {
    event.preventDefault();
    const recipient = allowedRecipients.find((entry) => String(entry.id) === String(recipientId));
    if (!recipient) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/messages/conversations/", {
        name: recipient.full_name,
        role: recipient.role,
        participant_ids: [recipient.id],
      });
      setNewConversation(false);
      setRecipientId("");
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de créer la conversation.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!activeConv?.id) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingMessages(true);
    setError("");
    api.get(`/messages/messages/conversation/${activeConv.id}`)
      .then((res) => {
        if (!cancelled) setMessages(res.data?.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Impossible de charger les messages.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => { cancelled = true; };
  }, [activeConv?.id]);

  const send = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeConv?.id) return;
    setSending(true);
    setError("");
    try {
      if (editingId) {
        const res = await api.patch(`/messages/messages/${editingId}`, { content });
        setMessages((previous) => previous.map((message) => message.id === editingId ? res.data : message));
      } else {
        const res = await api.post("/messages/messages/", { conversation_id: activeConv.id, content });
        setMessages((previous) => [...previous, res.data]);
      }
      setDraft("");
      setEditingId(null);
      refreshData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (messageId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await api.delete(`/messages/messages/${messageId}`);
      setMessages((previous) => previous.filter((message) => message.id !== messageId));
      refreshData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de supprimer le message.");
    }
  };

  if (!conversations?.length) {
    return <div className="page-animate"><Breadcrumbs items={[{ label: "Accueil" }, { label: "Communication" }, { label: "Messagerie" }]} /><div className="page-head"><div><h2>Messagerie</h2><p className="muted">{errors.conversations || "Aucune conversation disponible."}</p></div><button className="btn primary" onClick={() => setNewConversation(true)}>Nouvelle conversation</button></div>{newConversation && <form className="panel form-grid" onSubmit={createConversation} style={{ padding: 20 }}><label className="full">Destinataire<select className="field" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} required><option value="">Choisir un contact</option>{allowedRecipients.map((entry) => <option key={entry.id} value={entry.id}>{entry.full_name} · {entry.role}</option>)}</select></label><div className="actions"><button className="btn" type="button" onClick={() => setNewConversation(false)}>Annuler</button><button className="btn primary" type="submit" disabled={creating}>{creating ? "Création…" : "Créer"}</button></div></form>}</div>;
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Communication" }, { label: "Messagerie" }]} />
      <div className="page-head"><div><h2>Messagerie</h2><p className="muted">Conversations auxquelles votre compte participe.</p></div><button className="btn primary" onClick={() => setNewConversation(true)}>Nouvelle conversation</button></div>
      {newConversation && <form className="panel form-grid" onSubmit={createConversation} style={{ padding: 20, marginBottom: 16 }}><label className="full">Destinataire<select className="field" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} required><option value="">Choisir un contact</option>{allowedRecipients.map((entry) => <option key={entry.id} value={entry.id}>{entry.full_name} · {entry.role}</option>)}</select></label><div className="actions"><button className="btn" type="button" onClick={() => setNewConversation(false)}>Annuler</button><button className="btn primary" type="submit" disabled={creating}>{creating ? "Création…" : "Créer"}</button></div></form>}
      {(error || errors.conversations) && <p role="alert" style={{ color: "var(--danger)" }}>{error || errors.conversations}</p>}
      <div className="panel chat">
        <aside className="conversations">
          {conversations.map((conversation, index) => <button className={`conversation ${index === active ? "active" : ""}`} key={conversation.id} onClick={() => setActive(index)} type="button">
            <div className="avatar">{conversation.avatar || initials(conversation.name)}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}><strong>{conversation.name}</strong><p className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{conversation.lastMessage || "Aucun message"}</p></div>
            {conversation.unreadCount > 0 && <span className="counter" style={{ position: "static", marginLeft: "auto" }}>{conversation.unreadCount}</span>}
          </button>)}
        </aside>
        <section className="messages">
          <div className="panel-row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}><div className="avatar">{activeConv.avatar || initials(activeConv.name)}</div><div><strong>{activeConv.name}</strong><p className="muted" style={{ fontSize: 12 }}>{activeConv.role}</p></div></div>
          <div className="message-stream">{loadingMessages ? <p className="muted">Chargement des messages…</p> : messages.length === 0 ? <p className="muted">Cette conversation ne contient aucun message.</p> : messages.map((message) => {
            const own = message.sender_id === user?.id || message.sender_id === user?.user_id;
            return <div className={`bubble ${own ? "mine" : ""}`} key={message.id}><span>{message.content}</span>{own && <span className="no-print" style={{ display: "block", fontSize: 11, marginTop: 5 }}><button type="button" onClick={() => { setEditingId(message.id); setDraft(message.content); }}>Modifier</button> <button type="button" onClick={() => remove(message.id)}>Supprimer</button></span>}</div>;
          })}</div>
          <form className="composer" onSubmit={send}><input className="field" placeholder={editingId ? "Modifier le message…" : "Tapez votre message…"} value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Saisir un message" /><button className="btn primary" type="submit" disabled={sending}>{sending ? "Envoi…" : editingId ? "Enregistrer" : "Envoyer"}</button>{editingId && <button className="btn" type="button" onClick={() => { setEditingId(null); setDraft(""); }}>Annuler</button>}</form>
        </section>
      </div>
    </div>
  );
}
