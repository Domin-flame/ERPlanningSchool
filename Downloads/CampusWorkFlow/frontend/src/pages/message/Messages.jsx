import React, { useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// cette page n'est pas oppérationnelle
// il faut que je la connecte correctement au backend 
// comment les messages seront affichés ?
// quelles sont les actions que je peux effectuer sur un message par exemple : envoyer/supprimer/modifier un message, archivé et peut etre plus encore 
export default function Messages() {
  const { conversations } = useData();
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState("");
  const [stream, setStream] = useState([
    { own: false, text: "Bonjour, pouvez-vous me donner les dernières informations sur le projet ?" },
    { own: true, text: "Bien sûr ! Je prépare le résumé et vous l'envoie sous peu." },
    { own: false, text: "Merci beaucoup !" },
  ]);

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setStream((prev) => [...prev, { own: true, text: draft }]);
    setDraft("");
  };

  const activeConv = conversations[active];
  const userInitials = user?.avatar || (user?.full_name || user?.name || "??").substring(0, 2).toUpperCase();

  if (!conversations || conversations.length === 0) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Communication" }, { label: "Messagerie" }]} />
        <div className="page-head">
          <div>
            <h2>Messagerie</h2>
            <p className="muted">Aucune conversation disponible pour le moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Communication" }, { label: "Messagerie" }]} />
      <div className="page-head">
        <div>
          <h2>Messagerie</h2>
          <p className="muted">Messagerie interne, commentaires et notifications temps réel.</p>
        </div>
      </div>

      <div className="panel chat">
        <aside className="conversations">
          {conversations.map((c, i) => (
            <div
              className={`conversation ${i === active ? "active" : ""}`}
              key={c.id || i}
              onClick={() => setActive(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActive(i)}
            >
              <div className="avatar">{c.avatar || c.name?.substring(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.name}</strong>
                <p className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                  {c.lastMessage || c.last}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="counter" style={{ position: "static", marginLeft: "auto" }}>
                  {c.unreadCount}
                </span>
              )}
            </div>
          ))}
        </aside>

        {activeConv && (
          <section className="messages">
            <div className="panel-row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <div className="avatar">{activeConv.avatar || activeConv.name?.substring(0, 2).toUpperCase()}</div>
              <div>
                <strong>{activeConv.name}</strong>
                <p className="muted" style={{ fontSize: 12 }}>{activeConv.role}</p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className={`badge ${activeConv.online ? "success" : ""}`}>
                  {activeConv.online ? "En ligne" : "Hors ligne"}
                </span>
              </div>
            </div>

            <div className="message-stream">
              {stream.map((m, i) => (
                <div className={`bubble ${m.own ? "mine" : ""}`} key={i}>
                  {m.text}
                </div>
              ))}
            </div>

            <form className="composer" onSubmit={send}>
              <input
                className="field"
                placeholder="Tapez votre message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Saisir un message"
              />
              <button className="btn primary" type="submit">
                Envoyer
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
