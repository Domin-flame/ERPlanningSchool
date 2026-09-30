import React, { useEffect, useMemo, useRef, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import api from "../../api/client.js";

const LANGUAGE_BY_LOCALE = {
  fr: "fr",
  en: "en",
};

function detectLanguage() {
  const locale = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return LANGUAGE_BY_LOCALE[locale] || "fr";
}

export default function Assistant() {
  const [conversationId, setConversationId] = useState("");
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef(null);

  const language = useMemo(() => detectLanguage(), []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapConversation() {
      setLoading(true);
      setError("");
      try {
        const created = await api.post("/ai/chats", {});
        const id = created.data?.conversation_id;
        if (!id) throw new Error("Conversation invalide");
        if (cancelled) return;

        setConversationId(id);
        const details = await api.get(`/ai/chats/${id}`);
        if (!cancelled) {
          setHistory(details.data?.messages || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.response?.data?.detail || "Impossible d'initialiser l'assistant IA.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrapConversation();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [history, sending]);

  const onSend = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;

    const optimisticUserMessage = { role: "user", content: text };
    setHistory((prev) => [...prev, optimisticUserMessage]);
    setDraft("");
    setSending(true);
    setError("");

    try {
      const res = await api.post(`/ai/chats/${conversationId}/messages`, {
        message: text,
        language,
      });
      const fullHistory = res.data?.messages || [];
      setHistory(fullHistory);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Impossible d'obtenir une réponse de l'assistant IA.");
      setHistory((prev) => prev.filter((_, idx) => idx !== prev.length - 1));
    } finally {
      setSending(false);
    }
  };

  const onReset = async () => {
    if (!conversationId) return;
    setError("");
    setLoading(true);
    try {
      await api.delete(`/ai/chats/${conversationId}`);
      const created = await api.post("/ai/chats", {});
      const id = created.data?.conversation_id;
      if (!id) throw new Error("Conversation invalide");
      setConversationId(id);
      setHistory([]);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Impossible de réinitialiser la conversation IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Assistant IA" }]} />
      <div className="page-head">
        <div>
          <h2>Assistant IA CampusWorkflow</h2>
          <p className="muted">Posez vos questions sur les modules métiers, la navigation ou vos prochaines actions.</p>
        </div>
        <button className="btn" type="button" onClick={onReset} disabled={loading || sending || !conversationId}>
          Nouvelle conversation
        </button>
      </div>

      {(error || loading) && (
        <p role="alert" style={{ color: error ? "var(--danger)" : "var(--muted)" }}>
          {error || "Initialisation de l'assistant..."}
        </p>
      )}

      <div className="panel chat">
        <section className="messages" style={{ width: "100%" }}>
          <div className="panel-row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
            <strong>Conversation IA</strong>
            <p className="muted" style={{ fontSize: 12 }}>Langue: {language.toUpperCase()}</p>
          </div>

          <div className="message-stream" ref={streamRef}>
            {history.length === 0 && !loading && (
              <p className="muted">Commencez par une question, par exemple: "Comment consulter mes factures ?"</p>
            )}
            {history.map((entry, index) => {
              const own = entry.role === "user";
              return (
                <div className={`bubble ${own ? "mine" : ""}`} key={`${entry.role}-${index}`}>
                  <strong style={{ display: "block", marginBottom: 4 }}>{own ? "Vous" : "Assistant"}</strong>
                  <span>{entry.content}</span>
                </div>
              );
            })}
            {sending && <p className="muted">L'assistant rédige sa réponse...</p>}
          </div>

          <form className="composer" onSubmit={onSend}>
            <input
              className="field"
              placeholder="Écrivez votre question..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              disabled={loading || sending || !conversationId}
              aria-label="Question pour l'assistant IA"
            />
            <button className="btn primary" type="submit" disabled={loading || sending || !draft.trim() || !conversationId}>
              {sending ? "Envoi..." : "Envoyer"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
