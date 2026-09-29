import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, Send, UserRound } from "lucide-react";
import api from "../../api/client.js";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import PageHeader from "../../components/PageHeader.jsx";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Bonjour ! Je suis l’assistant IA de CampusWorkflow. Posez-moi une question sur l’application ou la vie universitaire.",
};

const SUGGESTIONS = [
  "Où trouver mon emploi du temps ?",
  "Comment consulter les cours ?",
  "Comment contacter un enseignant ?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || sending) return;
    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setSending(true);
    try {
      const history = messages
        .filter((item) => item !== INITIAL_MESSAGE)
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));
      const response = await api.post("/chatbot/message", { message, history });
      setMessages((current) => [...current, { role: "assistant", content: response.data.reply }]);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "L’assistant est temporairement indisponible. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const resetConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");
    setDraft("");
  };

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Assistant Campus" }]} />
      <PageHeader
        title="Assistant Campus"
        description="Posez une question pour être guidé dans les fonctionnalités de CampusWorkflow."
        actions={
          <button className="btn" type="button" onClick={resetConversation} disabled={messages.length === 1}>
            <RotateCcw size={16} /> Nouvelle conversation
          </button>
        }
      />

      <section className="panel campus-chatbot" aria-label="Conversation avec l’assistant">
        <div className="campus-chatbot-notice">
          Vos messages sont transmis au fournisseur d’IA configuré par votre établissement. N’envoyez pas de mot de passe ni de données personnelles ou confidentielles.
        </div>
        <div className="campus-chatbot-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`campus-chatbot-message ${message.role}`} key={`${index}-${message.role}`}>
              <span className="campus-chatbot-avatar" aria-hidden="true">
                {message.role === "assistant" ? <Bot size={18} /> : <UserRound size={18} />}
              </span>
              <p>{message.content}</p>
            </div>
          ))}
          {sending && <p className="muted campus-chatbot-loading" role="status">L’assistant prépare une réponse…</p>}
          <div ref={endRef} />
        </div>

        {messages.length === 1 && (
          <div className="campus-chatbot-suggestions" aria-label="Questions suggérées">
            {SUGGESTIONS.map((suggestion) => (
              <button className="btn" key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && <p className="campus-chatbot-error" role="alert">{error}</p>}
        <form className="campus-chatbot-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="campus-chatbot-input">Votre question</label>
          <input
            id="campus-chatbot-input"
            className="field"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1000}
            placeholder="Écrivez votre question…"
            disabled={sending}
          />
          <button className="btn primary" type="submit" disabled={sending || !draft.trim()} aria-label="Envoyer la question">
            <Send size={16} /> Envoyer
          </button>
        </form>
      </section>
    </div>
  );
}
