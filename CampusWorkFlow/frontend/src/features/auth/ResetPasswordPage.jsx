import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { Button, EmptyState, Field, FormError, Input } from "../../components/ui";
import { authApi } from "../../api/auth.js";
import { errorMessage } from "../../api/errors.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(token ? "" : "Lien de réinitialisation incomplet.");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setPending(true);
    setError("");
    try {
      await authApi.confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };

  return (
    <AuthLayout title="Nouveau mot de passe" footer={<Link to="/login">Retour à la connexion</Link>}>
      {done ? (
        <EmptyState
          icon={CheckCircle2}
          title="Mot de passe mis à jour"
          description="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
          action={<Link className="btn btn--primary btn--md" to="/login">Se connecter</Link>}
        />
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          <FormError message={error} />
          <Field label="Nouveau mot de passe" hint="8 caractères minimum." required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirmation" required>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" block icon={KeyRound} loading={pending} disabled={!token}>
            Mettre à jour
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
