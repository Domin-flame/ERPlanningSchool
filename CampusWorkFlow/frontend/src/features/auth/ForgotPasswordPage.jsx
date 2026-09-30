import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Send } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { Button, EmptyState, Field, FormError, Input } from "../../components/ui";
import { authApi } from "../../api/auth.js";
import { errorMessage } from "../../api/errors.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await authApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Recevez un lien de réinitialisation par email."
      footer={<Link to="/login">Retour à la connexion</Link>}
    >
      {sent ? (
        <EmptyState
          icon={MailCheck}
          title="Demande envoyée"
          description="Si cette adresse est enregistrée, un email contenant un lien de réinitialisation vous a été envoyé (valable 1 heure)."
        />
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          <FormError message={error} />
          <Field label="Adresse email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
          </Field>
          <Button type="submit" block icon={Send} loading={pending} disabled={!email}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
