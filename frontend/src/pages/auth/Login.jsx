import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLogo from "../../components/AppLogo.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function getRouteForRole(role) {
  const routes = {
    academic: "/academic",
    professeur: "/professeur",
    student: "/student",
    rh: "/hr",
    finance: "/finance",
    marketing: "/marketing",
  };

  return routes[role] || "/";
}

function getRoleShortName(role) {
  const names = {
    student: "Étudiant",
    professeur: "Enseignant",
    rh: "Responsable RH",
    finance: "Responsable Financier",
    marketing: "Responsable Marketing",
    academic: "Directeur",
  };

  return names[role] || role;
}

function getRoleLabel(role) {
  const labels = {
    academic: "Direction Académique",
    professeur: "Professeur",
    student: "Étudiant",
    rh: "Responsable RH",
    finance: "Responsable Financier",
    marketing: "Responsable Marketing",
  };

  return labels[role] || role;
}

const roles = [
  {
    id: "student",
    icon: "🎓",
    label: "Étudiant",
    desc: "Cours, devoirs, notes et emploi du temps.",
  },
  {
    id: "professeur",
    icon: "◈",
    label: "Enseignant",
    desc: "Classes, présences, cours et évaluations.",
  },
  {
    id: "academic",
    icon: "⌂",
    label: "Direction",
    desc: "Pilotage académique et supervision.",
  },
  {
    id: "rh",
    icon: "◎",
    label: "Ressources Humaines",
    desc: "Personnel, congés et administration RH.",
  },
  {
    id: "finance",
    icon: "◇",
    label: "Finance",
    desc: "Facturation, paiements et trésorerie.",
  },
  {
    id: "marketing",
    icon: "✦",
    label: "Marketing",
    desc: "Admissions, prospects et campagnes.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [registerStep, setRegisterStep] = useState(1);
  const [stepDirection, setStepDirection] = useState("next");
  const [selectedRole, setSelectedRole] = useState("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getRouteForRole(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const changeMode = (newMode) => {
    setMode(newMode);
    setErrorMsg("");
    setShowPassword(false);

    if (newMode === "register") {
      setRegisterStep(1);
      setStepDirection("next");
    }
  };

  const goNext = () => {
    setErrorMsg("");

    if (registerStep === 1 && !selectedRole) {
      setErrorMsg("Veuillez sélectionner votre rôle.");
      return;
    }

    if (registerStep === 2) {
      if (!fullName.trim()) {
        setErrorMsg("Veuillez renseigner votre nom et prénom.");
        return;
      }
    }

    setStepDirection("next");
    setRegisterStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => {
    setErrorMsg("");
    setStepDirection("back");
    setRegisterStep((prev) => Math.max(prev - 1, 1));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const res = await login(email, password);

    if (res.success) {
      setToastMsg(
        `Bienvenue, ${res.user.full_name} · ${getRoleLabel(res.user.role)}`
      );
      setToastShow(true);

      setTimeout(() => {
        navigate(getRouteForRole(res.user.role), { replace: true });
      }, 700);
    } else {
      setErrorMsg(res.message || "Connexion échouée.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    const res = await register({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role: selectedRole,
    });

    if (res.success) {
      if (res.user) {
        setToastMsg(
          `Compte créé · Bienvenue dans l'espace ${getRoleLabel(
            res.user.role
          )}.`
        );
        setToastShow(true);

        setTimeout(() => {
          navigate(getRouteForRole(res.user.role), { replace: true });
        }, 700);
      } else {
        setMode("login");
        setRegisterStep(1);
        setToastMsg(res.message || "Compte créé. Veuillez vous connecter.");
        setToastShow(true);
      }
    } else {
      setErrorMsg(res.message || "Inscription échouée.");
    }
  };

  const selectedRoleData =
    roles.find((role) => role.id === selectedRole) || roles[0];

  return (
    <div className="login-page">
      {/* Décor animé */}
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-deco login-deco-1" aria-hidden="true" />
      <div className="login-deco login-deco-2" aria-hidden="true" />
      <div className="login-deco login-deco-3" aria-hidden="true" />
      <div className="login-orbit login-orbit-1" aria-hidden="true" />
      <div className="login-orbit login-orbit-2" aria-hidden="true" />

      <main className="login-shell">
        {/* Colonne identité / branding */}
        <section className="login-visual">
          <div className="login-brand-block">
            <div className="login-brand-mark">
              <AppLogo size={48} />
            </div>

            <div>
              <span className="login-brand-kicker">ERP SCOLAIRE</span>
              <strong className="login-brand-text">CampusWorkflow</strong>
            </div>
          </div>

          <div className="login-visual-content">
            <div className="login-mascot-stage">
              <div className="mascot-ring mascot-ring-1" />
              <div className="mascot-ring mascot-ring-2" />
              <div className="mascot-orbit-dot" />
              <div className="login-mascot-float">
                <AppLogo size={142} />
              </div>
            </div>

            <div className="login-hero-copy">
              <span className="login-eyebrow">
                {mode === "login" ? "VOTRE ESPACE DE TRAVAIL" : "NOUVEAU COMPTE"}
              </span>

              <h1>
                {mode === "login"
                  ? "Votre campus, tout simplement."
                  : "Construisons votre espace."}
              </h1>

              <p>
                Une plateforme unique pour connecter l'administration,
                l'académique, les enseignants et les étudiants.
              </p>
            </div>
          </div>

          <div className="login-visual-footer">
            <span className="status-dot" />
            Système sécurisé
            <span className="footer-separator">•</span>
            Authentification JWT
          </div>
        </section>

        {/* Formulaire */}
        <section className="login-panel">
          <div className="login-panel-inner">
            <div className="login-panel-top">
              <div>
                <span className="login-panel-kicker">
                  {mode === "login" ? "ESPACE SÉCURISÉ" : "CRÉATION DE COMPTE"}
                </span>

                <h2>
                  {mode === "login"
                    ? "Ravi de vous revoir."
                    : registerStep === 1
                    ? "Commençons par votre rôle."
                    : registerStep === 2
                    ? "Parlez-nous de vous."
                    : "Créons vos accès."}
                </h2>
              </div>

              <div className="login-security-badge" title="Connexion sécurisée">
                <span>⌁</span>
                Sécurisé
              </div>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => changeMode("login")}
              >
                Connexion
              </button>

              <button
                type="button"
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => changeMode("register")}
              >
                Créer un compte
              </button>
            </div>

            {mode === "register" && (
              <div className="register-progress">
                <div className="register-progress-line">
                  <span
                    style={{
                      width: `${((registerStep - 1) / 2) * 100}%`,
                    }}
                  />
                </div>

                <div className="register-steps">
                  {[
                    { number: 1, label: "Rôle" },
                    { number: 2, label: "Identité" },
                    { number: 3, label: "Compte" },
                  ].map((step) => (
                    <div
                      key={step.number}
                      className={`register-step ${
                        registerStep >= step.number ? "active" : ""
                      } ${registerStep === step.number ? "current" : ""}`}
                    >
                      <span>{registerStep > step.number ? "✓" : step.number}</span>
                      <small>{step.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="login-error" role="alert">
                <span>!</span>
                <p>{errorMsg}</p>
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="login-form page-fade-enter">
                <div className="form-intro">
                  <p>
                    Connectez-vous pour accéder à votre environnement
                    CampusWorkflow.
                  </p>
                </div>

                <label>
                  Adresse email
                  <div className="input-shell">
                    <span className="input-icon">@</span>
                    <input
                      type="email"
                      className="field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@campus.edu"
                      required
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label>
                  Mot de passe
                  <div className="input-shell">
                    <span className="input-icon">◆</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? "◉" : "◌"}
                    </button>
                  </div>
                </label>

                <div className="login-row">
                  <label className="check">
                    <input type="checkbox" defaultChecked />
                    <span>Se souvenir de moi</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() =>
                      setToastMsg(
                        "La récupération du mot de passe sera disponible prochainement."
                      ) || setToastShow(true)
                    }
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  className="btn primary login-btn login-submit"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Connexion en cours…" : "Se connecter"}</span>
                  {!loading && <span className="submit-arrow">→</span>}
                </button>

                <p className="form-bottom-note">
                  Vous n'avez pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => changeMode("register")}
                  >
                    Créer un accès
                  </button>
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleRegister}
                className={`register-form register-step-animation ${stepDirection}`}
                key={`register-step-${registerStep}`}
              >
                {/* ÉTAPE 1 : RÔLE */}
                {registerStep === 1 && (
                  <div className="register-view">
                    <div className="step-intro">
                      <p>
                        Sélectionnez le rôle qui correspond à votre fonction
                        dans l'établissement.
                      </p>
                    </div>

                    <div className="role-selector-grid">
                      {roles.map(({ id, icon, label, desc }) => (
                        <button
                          type="button"
                          key={id}
                          className={`role-card-option ${
                            selectedRole === id ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedRole(id);
                            setErrorMsg("");
                          }}
                        >
                          <span className="role-card-icon">{icon}</span>

                          <span className="role-text">
                            <strong>{label}</strong>
                            <small>{desc}</small>
                          </span>

                          <span className="role-check">
                            {selectedRole === id ? "✓" : ""}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn primary login-btn step-btn"
                      onClick={goNext}
                    >
                      Continuer
                      <span className="submit-arrow">→</span>
                    </button>
                  </div>
                )}

                {/* ÉTAPE 2 : IDENTITÉ */}
                {registerStep === 2 && (
                  <div className="register-view">
                    <div className="selected-role-summary">
                      <span className="selected-role-icon">
                        {selectedRoleData.icon}
                      </span>
                      <div>
                        <small>Votre profil</small>
                        <strong>{selectedRoleData.label}</strong>
                      </div>
                      <button type="button" onClick={goBack}>
                        Modifier
                      </button>
                    </div>

                    <div className="step-intro">
                      <p>
                        Ces informations permettront d'identifier votre profil
                        au sein de CampusWorkflow.
                      </p>
                    </div>

                    <label>
                      Nom & prénom
                      <div className="input-shell">
                        <span className="input-icon">◯</span>
                        <input
                          type="text"
                          className="field"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex. Alexandre Martin"
                          required
                          autoComplete="name"
                          autoFocus
                        />
                      </div>
                    </label>

                    <button
                      type="button"
                      className="btn primary login-btn step-btn"
                      onClick={goNext}
                    >
                      Continuer
                      <span className="submit-arrow">→</span>
                    </button>

                    <button
                      type="button"
                      className="step-back-btn"
                      onClick={goBack}
                    >
                      ← Retour
                    </button>
                  </div>
                )}

                {/* ÉTAPE 3 : COMPTE */}
                {registerStep === 3 && (
                  <div className="register-view">
                    <div className="step-intro">
                      <p>
                        Définissez maintenant les identifiants qui vous
                        permettront de vous connecter.
                      </p>
                    </div>

                    <label>
                      Adresse email académique
                      <div className="input-shell">
                        <span className="input-icon">@</span>
                        <input
                          type="email"
                          className="field"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre.nom@campus.edu"
                          required
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </label>

                    <label>
                      Mot de passe
                      <div className="input-shell">
                        <span className="input-icon">◆</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="field"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 8 caractères"
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          className="pass-toggle"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          {showPassword ? "◉" : "◌"}
                        </button>
                      </div>
                    </label>

                    <div className="account-summary">
                      <div>
                        <span>Profil</span>
                        <strong>{selectedRoleData.label}</strong>
                      </div>
                      <div>
                        <span>Identité</span>
                        <strong>{fullName}</strong>
                      </div>
                    </div>

                    <button
                      className="btn primary login-btn login-submit step-btn"
                      type="submit"
                      disabled={loading}
                    >
                      <span>
                        {loading
                          ? "Création en cours…"
                          : `Créer mon accès ${getRoleShortName(selectedRole)}`}
                      </span>
                      {!loading && <span className="submit-arrow">→</span>}
                    </button>

                    <button
                      type="button"
                      className="step-back-btn"
                      onClick={goBack}
                    >
                      ← Modifier mon identité
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>
      </main>

      <div className="login-bottom-brand">
        CampusWorkflow <span>•</span> ERP Scolaire Intelligent
      </div>

      <Toast show={toastShow} message={toastMsg} sub="CampusWorkflow Auth" />
    </div>
  );
}