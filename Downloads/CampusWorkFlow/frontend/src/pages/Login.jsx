import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FoxMascot from "../components/FoxMascot.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Routes de destination par rôle
function getRouteForRole(role) {
  const routes = {
    academic: "/",
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
    professeur: "Professeur / Enseignant",
    student: "Étudiant",
    rh: "Responsable RH",
    finance: "Responsable Financier",
    marketing: "Responsable Marketing",
  };
  return labels[role] || role;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getRouteForRole(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const res = await login(email, password);
    if (res.success) {
      setToastMsg(`Bienvenue, ${res.user.full_name} (${getRoleLabel(res.user.role)})`);
      setToastShow(true);
      const targetRoute = getRouteForRole(res.user.role);
      setTimeout(() => navigate(targetRoute, { replace: true }), 700);
    } else {
      setErrorMsg(res.message || "Connexion échouée");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName || !email || !password) {
      setErrorMsg("Tous les champs sont obligatoires");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    const res = await register({
      full_name: fullName,   // aligné avec le payload UserCreate du backend
      email,
      password,
      role: selectedRole,
    });

    if (res.success) {
      if (res.user) {
        setToastMsg(`Compte créé ! Espace ${getRoleLabel(res.user.role)}`);
        setToastShow(true);
        const targetRoute = getRouteForRole(res.user.role);
        setTimeout(() => navigate(targetRoute, { replace: true }), 700);
      } else {
        // Inscription réussie sans connexion auto → rediriger vers login
        setMode("login");
        setToastMsg(res.message || "Compte créé. Veuillez vous connecter.");
        setToastShow(true);
      }
    } else {
      setErrorMsg(res.message || "Inscription échouée");
    }
  };

  return (
    <div className="login-page">
      <div className="login-deco login-deco-1" aria-hidden="true" />
      <div className="login-deco login-deco-2" aria-hidden="true" />

      <header className="login-header">
        <div className="login-logo-wrap" onClick={() => navigate("/splash")} style={{ cursor: "pointer" }}>
          <FoxMascot size={42} />
          <span className="login-brand-text">CampusWorkflow</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost sm" onClick={() => navigate("/splash")}>Accueil</button>
          <button className="btn ghost sm" onClick={() => navigate("/onboarding")}>Présentation</button>
        </div>
      </header>

      <div className="login-container">
        <div className="login-mascot-float">
          <FoxMascot size={90} variant={mode === "register" ? "wave" : "default"} />
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setErrorMsg(""); }}
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setErrorMsg(""); }}
          >
            Créer un compte
          </button>
        </div>

        {/* Message d'erreur global */}
        {errorMsg && (
          <div
            style={{
              background: "var(--danger-bg, #fef2f2)",
              color: "var(--danger, #dc2626)",
              border: "1px solid var(--danger, #dc2626)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            {errorMsg}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="login-form page-fade-enter">
            <h2>Bon retour parmi nous !</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Accédez à votre portail académique personnalisé.
            </p>

            <label>
              Adresse Email
              <input
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@campus.edu"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Mot de passe
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </label>

            <div className="login-row">
              <label className="check">
                <input type="checkbox" defaultChecked /> Se souvenir de moi
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>Mot de passe oublié ?</a>
            </div>

            <button className="btn primary login-btn" type="submit" disabled={loading}>
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form page-fade-enter">
            <h2>Créer votre accès ERP</h2>
            <p className="muted" style={{ marginBottom: 16 }}>
              Choisissez impérativement le rôle de votre profil lors de votre inscription.
            </p>

            {/* Sélecteur de rôle */}
            <div className="role-selector-grid" style={{ marginBottom: 18 }}>
              {[
                { id: "student", icon: "🎓", label: "Étudiant", desc: "Accès aux cours, devoirs et emplois du temps." },
                { id: "professeur", icon: "👨‍🏫", label: "Enseignant", desc: "Gestion de classe, saisie des notes et présences." },
                { id: "rh", icon: "👥", label: "Responsable RH", desc: "Gestion du personnel, congés et bulletins de paie." },
                { id: "finance", icon: "💶", label: "Finance", desc: "Factures, encaissements et trésorerie." },
                { id: "marketing", icon: "🎯", label: "Marketing", desc: "CRM, leads, campagnes et admissions." },
                { id: "academic", icon: "🏛️", label: "Direction", desc: "Vue d'ensemble et rapports académiques." },
              ].map(({ id, icon, label, desc }) => (
                <div
                  key={id}
                  className={`role-card-option ${id} ${selectedRole === id ? "active" : ""}`}
                  onClick={() => setSelectedRole(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedRole(id)}
                >
                  <div className="icon-wrap">{icon}</div>
                  <div className="role-text">
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <label>
              Nom & Prénom *
              <input
                type="text"
                className="field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex. Alexandre Martin"
                required
                autoComplete="name"
              />
            </label>

            <label>
              Adresse Email académique *
              <input
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.nom@campus.edu"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Mot de passe * (min. 8 caractères)
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </label>

            <button className="btn primary login-btn" type="submit" disabled={loading}>
              {loading ? "Création en cours…" : `Rejoindre en tant que ${getRoleShortName(selectedRole)}`}
            </button>
          </form>
        )}
      </div>

      <Toast show={toastShow} message={toastMsg} sub="CampusWorkflow Auth" />
    </div>
  );
}
