import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Pencil, Plus, Send, Trash2, Users } from "lucide-react";
import {
  AsyncContent, Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, FormError, IconButton, Input, Modal,
  PageHeader, SearchInput, SkeletonRows, Textarea,
} from "../../components/ui";
import { messagesApi } from "../../api/messages.js";
import { authApi } from "../../api/auth.js";
import { errorMessage, toApiError } from "../../api/errors.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { roleLabel } from "../../app/roles.js";
import { formatDateTime, formatRelative, formatTime, matchesQuery } from "../../utils/format.js";

const POLL_MS = 15000;
const SEPARATOR = " ↔ ";
const STUDENT_RECIPIENTS = new Set(["student", "professeur", "academic", "finance"]);

/** Nom affiché d'une conversation : on retire le nom de l'utilisateur courant des conversations 1-à-1. */
function displayName(conversation, me) {
  if (!conversation?.name) return "Conversation";
  if (conversation.is_group || !conversation.name.includes(SEPARATOR)) return conversation.name;
  return conversation.name.split(SEPARATOR).filter((n) => n !== me).join(", ") || conversation.name;
}

function NewConversationModal({ onClose, onCreated }) {
  const { user, role } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(authApi.directory, { initialData: [] });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  const contacts = useMemo(
    () => (data || []).filter((c) => c.id !== user?.id && (role !== "student" || STUDENT_RECIPIENTS.has(c.role)) &&
      matchesQuery(query, c.full_name, c.email, roleLabel(c.role))),
    [data, user, role, query]
  );
  const toggle = (contact) => setSelected((prev) => (prev.some((c) => c.id === contact.id) ? prev.filter((c) => c.id !== contact.id) : [...prev, contact]));
  const isGroup = selected.length > 1;

  const submit = async () => {
    if (!selected.length) return setFormError("Choisissez au moins un destinataire.");
    if (isGroup && !groupName.trim()) return setFormError("Donnez un nom au groupe.");
    setPending(true);
    setFormError("");
    try {
      const conversation = await messagesApi.createConversation({
        name: isGroup ? groupName.trim() : [user.full_name, selected[0].full_name].join(SEPARATOR),
        participant_ids: selected.map((c) => Number(c.id)),
        is_group: isGroup,
        role: isGroup ? null : selected[0].role,
      });
      toast.success("Conversation créée.");
      onCreated(conversation);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };

  return (
    <Modal open size="lg" title="Nouvelle conversation" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={pending} onClick={submit}>Démarrer</Button></>}>
      <div className="stack">
        <FormError message={formError} />
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher dans l'annuaire…" />
        {selected.length > 0 && (
          <div className="row row--wrap">
            {selected.map((c) => <Badge key={c.id} tone="brand">{c.full_name}</Badge>)}
          </div>
        )}
        {isGroup && <Field label="Nom du groupe" required><Input value={groupName} onChange={(e) => setGroupName(e.target.value)} /></Field>}
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!contacts.length} empty={<EmptyState compact title="Aucun contact" />}>
          <ul className="list list--selectable" style={{ maxHeight: 320, overflowY: "auto" }}>
            {contacts.map((c) => {
              const active = selected.some((s) => s.id === c.id);
              return (
                <li key={c.id}>
                  <button type="button" className={`list__item list__button ${active ? "is-active" : ""}`} onClick={() => toggle(c)} aria-pressed={active}>
                    <Avatar name={c.full_name} size={32} />
                    <span className="grow"><strong>{c.full_name}</strong><small className="muted block">{c.email}</small></span>
                    <Badge tone="neutral">{roleLabel(c.role)}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </AsyncContent>
      </div>
    </Modal>
  );
}

function Thread({ conversation, me, onChanged, onBack }) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState({ loading: true, error: null });
    try {
      const list = await messagesApi.messages(conversation.id);
      setMessages(list);
      setState({ loading: false, error: null });
    } catch (err) {
      if (!silent) setState({ loading: false, error: toApiError(err) });
    }
  }, [conversation.id]);

  useEffect(() => {
    lastCount.current = 0;
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const submit = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      if (editing) {
        const updated = await messagesApi.edit(editing.id, content);
        setMessages((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...updated } : m)));
        setEditing(null);
      } else {
        const created = await messagesApi.send(conversation.id, content);
        setMessages((prev) => [...prev, created]);
        onChanged();
      }
      setDraft("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (message) => {
    try {
      await messagesApi.remove(message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section className="chat__thread" aria-label="Conversation">
      <header className="chat__thread-header">
        <IconButton icon={ArrowLeft} label="Retour" className="chat__back" onClick={onBack} />
        <Avatar name={displayName(conversation, me.full_name)} size={36} />
        <div className="grow">
          <strong>{displayName(conversation, me.full_name)}</strong>
          <small className="muted block">{conversation.is_group ? "Groupe" : roleLabel(conversation.role)}</small>
        </div>
      </header>
      <div className="chat__messages">
        {state.loading ? <SkeletonRows rows={4} /> : state.error ? <ErrorState error={state.error} onRetry={() => load()} compact /> : !messages.length ? (
          <EmptyState compact icon={MessageSquare} title="Aucun message" description="Écrivez le premier message." />
        ) : (
          messages.map((m) => {
            const mine = Number(m.sender_id) === Number(me.id);
            return (
              <div key={m.id} className={`chat__bubble ${mine ? "is-mine" : ""}`}>
                {!mine && conversation.is_group && <small className="chat__author">{m.sender_name}</small>}
                <p>{m.content}</p>
                <footer>
                  <time dateTime={m.created_at} title={formatDateTime(m.created_at)}>{formatTime(m.created_at)}</time>
                  {mine && (
                    <span className="chat__actions">
                      <button type="button" onClick={() => { setEditing(m); setDraft(m.content); }} aria-label="Modifier"><Pencil size={12} /></button>
                      <button type="button" onClick={() => remove(m)} aria-label="Supprimer"><Trash2 size={12} /></button>
                    </span>
                  )}
                </footer>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form className="chat__composer" onSubmit={submit}>
        {editing && (
          <div className="chat__editing">
            Modification du message <button type="button" className="link-sm" onClick={() => { setEditing(null); setDraft(""); }}>Annuler</button>
          </div>
        )}
        <Textarea rows={1} value={draft} placeholder="Écrire un message…" aria-label="Message" onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }} />
        <IconButton icon={Send} label="Envoyer" type="submit" className="icon-btn--primary" disabled={sending || !draft.trim()} />
      </form>
    </section>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(messagesApi.conversations, { initialData: [] });
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => document.visibilityState === "visible" && reload(), POLL_MS * 2);
    return () => clearInterval(timer);
  }, [reload]);

  const conversations = useMemo(
    () => [...(data || [])]
      .sort((a, b) => String(b.last_message_at || b.created_at).localeCompare(String(a.last_message_at || a.created_at)))
      .filter((c) => matchesQuery(query, displayName(c, user?.full_name), c.last_message)),
    [data, query, user]
  );
  const active = (data || []).find((c) => c.id === activeId);

  return (
    <div className="page page--fill">
      <PageHeader eyebrow="Communication" title="Messagerie" description="Échanges internes entre étudiants, enseignants et services."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>Nouvelle conversation</Button>} />
      <Card padded={false} className={`chat ${active ? "has-active" : ""}`}>
        <aside className="chat__list" aria-label="Conversations">
          <div className="chat__search"><SearchInput value={query} onChange={setQuery} placeholder="Rechercher…" /></div>
          {loading && !data?.length ? <SkeletonRows rows={5} /> : error ? <ErrorState error={error} onRetry={reload} compact /> : !conversations.length ? (
            <EmptyState compact icon={Users} title="Aucune conversation" action={<Button size="sm" onClick={() => setCreating(true)}>Démarrer</Button>} />
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button type="button" className={`chat__item ${c.id === activeId ? "is-active" : ""}`} onClick={() => setActiveId(c.id)}>
                    <Avatar name={displayName(c, user?.full_name)} size={36} />
                    <span className="chat__item-body">
                      <span className="row row--between"><strong>{displayName(c, user?.full_name)}</strong><small className="muted">{formatRelative(c.last_message_at || c.created_at)}</small></span>
                      <span className="row row--between"><small className="muted truncate">{c.last_message || "Nouvelle conversation"}</small>{c.unread > 0 && <span className="count-pill">{c.unread}</span>}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        {active ? (
          <Thread key={active.id} conversation={active} me={user} onChanged={reload} onBack={() => setActiveId(null)} />
        ) : (
          <div className="chat__placeholder"><EmptyState icon={MessageSquare} title="Sélectionnez une conversation" description="Ou démarrez-en une nouvelle depuis l'annuaire." /></div>
        )}
      </Card>
      {creating && <NewConversationModal onClose={() => setCreating(false)} onCreated={(c) => { setCreating(false); reload(); setActiveId(c.id); }} />}
    </div>
  );
}
