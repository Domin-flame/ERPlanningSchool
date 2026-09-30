import React, { useState } from "react";
import { KeyRound, LogOut, UserCircle } from "lucide-react";
import { Avatar, Badge, Button, Card, Field, FormError, Input, PageHeader } from "../../components/ui";
import { authApi } from "../../api/auth.js";
import { errorMessage } from "../../api/errors.js";
import { API_BASE_URL } from "../../api/http.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { roleLabel } from "../../app/roles.js";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.next.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (form.next !== form.confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setPending(true);
    setError("");
    try {
      await authApi.changePassword(form.old, form.next);
      setForm({ old: "", next: "", confirm: "" });
      toast.success("Mot de passe modifié.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };

  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Compte" title="Paramètres" description="Profil et sécurité de votre compte." />
      <Card title="Profil" actions={<UserCircle size={18} aria-hidden="true" className="muted" />}>
        <div className="profile">
          <Avatar name={user?.full_name} size={56} />
          <div className="stack stack--sm">
            <strong className="profile__name">{user?.full_name}</strong>
            <span className="muted">{user?.email}</span>
            <span><Badge tone="brand">{roleLabel(user?.role)}</Badge></span>
          </div>
        </div>
      </Card>
      <Card title="Sécurité" subtitle="Changer votre mot de passe" actions={<KeyRound size={18} aria-hidden="true" className="muted" />}>
        <form className="stack" onSubmit={submit}>
          <FormError message={error} />
          <Field label="Mot de passe actuel" required><Input type="password" autoComplete="current-password" value={form.old} onChange={update("old")} /></Field>
          <Field label="Nouveau mot de passe" hint="8 caractères minimum" required><Input type="password" autoComplete="new-password" value={form.next} onChange={update("next")} /></Field>
          <Field label="Confirmation" required><Input type="password" autoComplete="new-password" value={form.confirm} onChange={update("confirm")} /></Field>
          <div><Button type="submit" loading={pending}>Mettre à jour</Button></div>
        </form>
      </Card>
      <Card title="Session">
        <div className="row row--between">
          <small className="muted">API : <code>{API_BASE_URL}</code></small>
          <Button variant="danger" icon={LogOut} onClick={logout}>Se déconnecter</Button>
        </div>
      </Card>
    </div>
  );
}
