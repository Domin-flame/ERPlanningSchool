import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Card, IconButton, PageHeader, Textarea } from "../../components/ui";
import { systemApi } from "../../api/system.js";
import { toApiError } from "../../api/errors.js";
import { useAuth } from "../../hooks/useAuth.js";

const HISTORY_LIMIT = 12;
const SUGGESTIONS = {
  student: ["Comment consulter mes notes ?", "Comment payer mes frais de scolarité ?", "Comment m'inscrire à un cours ?"],
  professeur: ["Comment faire l'appel ?", "Comment saisir les notes d'un examen ?"],
  academic: ["Comment ajouter un étudiant ?", "Où voir les indicateurs clés ?"],
  rh: ["Comment générer un bulletin de paie ?", "Comment valider un congé ?"],
  finance: ["Comment émettre une facture ?", "Comment enregistrer un paiement Mobile Money ?"],
  marketing: ["Comment suivre la conversion des prospects ?", "Comment créer une campagne ?"],
};

export default function AssistantPage() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, pending]);

  const ask = async (text) => {
    const content = (text ?? draft).trim();
    if (!content || pending) return;
    const history = messages.filter((m) => !m.error).slice(-HISTORY_LIMIT).map(({ role: r, content: c }) => ({ role: r, content: c }));
    setMessages((prev) => [...prev, { role: "user", content }]);
    setDraft("");
    setPending(true);
    try {
      const res = await systemApi.askAssistant(content, history);
      setMessages((prev) => [...prev, { role: "assistant", content: res?.reply || "Je n'ai pas de réponse pour le moment." }]);
    } catch (err) {
      const apiError = toApiError(err);
      const message = apiError.status === 503
        ? "L'assistant n'est pas configuré sur ce serveur (clé API manquante). Contactez l'administrateur."
        : apiError.message;
      setMessages((prev) => [...prev, { role: "assistant", content: message, error: true }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="page page--fill">
      <PageHeader eyebrow="Outils" title="Assistant CampusWorkflow" description="Posez vos questions sur l'utilisation de la plateforme." />
      <Card padded={false} className="assistant">
        <div className="assistant__messages">
          {!messages.length && (
            <div className="assistant__intro">
              <span className="assistant__logo"><Sparkles size={24} aria-hidden="true" /></span>
              <h2>Bonjour {user?.full_name?.split(" ")[0]} 👋</h2>
              <p className="muted">Comment puis-je vous aider aujourd'hui ?</p>
              <div className="assistant__suggestions">
                {(SUGGESTIONS[role] || []).map((s) => <button key={s} type="button" className="chip" onClick={() => ask(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat__bubble ${m.role === "user" ? "is-mine" : ""} ${m.error ? "is-error" : ""}`}>
              {m.role === "assistant" && <small className="chat__author"><Bot size={12} aria-hidden="true" /> Assistant</small>}
              <p>{m.content}</p>
            </div>
          ))}
          {pending && <div className="chat__bubble"><span className="typing" aria-label="L'assistant écrit"><i /><i /><i /></span></div>}
          <div ref={endRef} />
        </div>
        <form className="chat__composer" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <Textarea rows={1} value={draft} placeholder="Votre question…" aria-label="Question" onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} />
          <IconButton icon={Send} label="Envoyer" type="submit" className="icon-btn--primary" disabled={pending || !draft.trim()} />
        </form>
      </Card>
    </div>
  );
}
