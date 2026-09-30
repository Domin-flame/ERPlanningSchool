import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { Button, Field, FormError, Input } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth.js";
import { errorMessage } from "../../api/errors.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(form.email, form.password);
      const from = location.state?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/dashboard", { replace: true });
    } catch (err) {
      setError(err?.status === 401 ? "Email ou mot de passe incorrect." : errorMessage(err, "Connexion impossible."));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace CampusWorkflow."
      footer={
        <>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </>
      }
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <FormError message={error} />
        <Field label="Adresse email" required>
          <Input type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="prenom.nom@campus.cm" autoFocus />
        </Field>
        <Field label="Mot de passe" required>
          <div className="input-group">
            <Input type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={update("password")} />
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <div className="row row--between">
          <span />
          <Link to="/forgot-password" className="link-sm">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" block icon={LogIn} loading={pending} disabled={!form.email || !form.password}>
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
