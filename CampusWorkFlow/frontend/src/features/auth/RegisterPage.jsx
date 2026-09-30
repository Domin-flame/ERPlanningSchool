import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Briefcase, Building2, GraduationCap, Megaphone, Wallet, UserPlus } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { Button, Field, FormError, Input } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLE_META, ROLES } from "../../app/roles.js";
import { errorMessage } from "../../api/errors.js";

const ROLE_ICONS = {
  student: GraduationCap,
  professeur: BookOpen,
  academic: Building2,
  rh: Briefcase,
  finance: Wallet,
  marketing: Megaphone,
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: "student", full_name: "", email: "", password: "", confirm: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    if (!form.full_name.trim()) return "Renseignez votre nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Adresse email invalide.";
    if (form.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (form.password !== form.confirm) return "Les mots de passe ne correspondent pas.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPending(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Inscription impossible."));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle={step === 1 ? "Étape 1 sur 2 — choisissez votre profil." : `Étape 2 sur 2 — profil ${ROLE_META[form.role].label}.`}
      footer={
        <>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </>
      }
    >
      {step === 1 ? (
        <div className="stack">
          <div className="role-grid" role="radiogroup" aria-label="Profil">
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              const selected = form.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`role-option ${selected ? "is-selected" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, role }))}
                >
                  <Icon size={20} aria-hidden="true" />
                  <strong>{ROLE_META[role].label}</strong>
                  <small>{ROLE_META[role].description}</small>
                </button>
              );
            })}
          </div>
          <Button block iconRight={ArrowRight} onClick={() => setStep(2)}>
            Continuer
          </Button>
        </div>
      ) : (
        <form className="stack" onSubmit={handleSubmit} noValidate>
          <FormError message={error} />
          <Field label="Nom complet" required>
            <Input value={form.full_name} onChange={update("full_name")} autoComplete="name" autoFocus />
          </Field>
          <Field label="Adresse email" required>
            <Input type="email" value={form.email} onChange={update("email")} autoComplete="email" />
          </Field>
          <Field label="Mot de passe" hint="8 caractères minimum." required>
            <Input type="password" value={form.password} onChange={update("password")} autoComplete="new-password" />
          </Field>
          <Field label="Confirmation" required>
            <Input type="password" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" />
          </Field>
          <div className="row">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => { setError(""); setStep(1); }}>
              Retour
            </Button>
            <Button type="submit" icon={UserPlus} loading={pending} className="grow">
              Créer mon compte
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
