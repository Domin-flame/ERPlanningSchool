import React, { useMemo, useState } from "react";
import { UserCog } from "lucide-react";
import { Avatar, Badge, Button, Card, DataTable, EmptyState, PageHeader, SearchInput, Select, Toolbar } from "../../components/ui";
import { authApi } from "../../api/auth.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { ROLES, roleLabel } from "../../app/roles.js";
import { formatDate, matchesQuery } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";

const loadAccounts = () => authApi.listUsers();

export default function AccountsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi(loadAccounts, { initialData: [] });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busy, setBusy] = useState(null);

  const rows = useMemo(
    () => (data || []).filter((a) => (!roleFilter || a.role === roleFilter) && matchesQuery(query, a.full_name, a.email)),
    [data, query, roleFilter]
  );

  const act = async (account, action, role) => {
    setBusy(account.id);
    try {
      const updated = await authApi.manageUser(account.id, action, role);
      setData((prev) => prev.map((a) => (a.id === account.id ? { ...a, ...updated } : a)));
      toast.success("Compte mis à jour.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const columns = [
    { key: "full_name", header: "Utilisateur", render: (a) => (
      <div className="cell-identity"><Avatar name={a.full_name} size={32} /><div><strong>{a.full_name}</strong><small>{a.email}</small></div></div>
    ) },
    { key: "role", header: "Rôle", render: (a) => (
      <select className="input input--inline" value={a.role} disabled={busy === a.id || a.id === user?.id} onChange={(e) => act(a, "change_role", e.target.value)} aria-label="Rôle">
        {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
      </select>
    ) },
    { key: "created_at", header: "Créé le", render: (a) => formatDate(a.created_at) },
    { key: "is_active", header: "Statut", render: (a) => <Badge tone={a.is_active === false ? "neutral" : "success"} dot>{a.is_active === false ? "Désactivé" : "Actif"}</Badge> },
    { key: "actions", header: "", sortable: false, align: "right", render: (a) => a.id !== user?.id && (
      a.is_active === false
        ? <Button size="sm" variant="secondary" loading={busy === a.id} onClick={() => act(a, "activate")}>Activer</Button>
        : <Button size="sm" variant="ghost" loading={busy === a.id} onClick={() => act(a, "deactivate")}>Désactiver</Button>
    ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Administration" title="Comptes utilisateurs" description="Accès à la plateforme : activation et rôles (service d'authentification)." />
      <Card padded={false}>
        <Toolbar end={<span className="muted">{rows.length} compte(s)</span>}>
          <SearchInput value={query} onChange={setQuery} placeholder="Nom ou email…" />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} placeholder="Tous les rôles" options={ROLES.map((r) => ({ value: r, label: roleLabel(r) }))} aria-label="Rôle" />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={loading} error={error} onRetry={reload}
          empty={<EmptyState icon={UserCog} title="Aucun compte" />} />
      </Card>
    </div>
  );
}
