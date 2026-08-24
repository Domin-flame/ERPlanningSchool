import React, { useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import api from "../../api/client.js";

// pour les paramètres améliorer tout d'abord le visuel car je trouve que ca manque de structure, il faut pouvoir changer la langue de l'application, se déconnecter, changer de mot de passe, activer et désactiver les notifications, ce sont les fonctionnalités de base que je veux voir dans l'application

export default function Settings() {
  const { user, logout } = useAuth();
  const { preferences, updatePreference } = useData();
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const displayName = user?.full_name || user?.name || "Utilisateur";
  const initials = displayName.substring(0, 2).toUpperCase();
  const passwordRules = [
    { label: "8 caractères minimum", valid: newPassword.length >= 8 },
    { label: "Une majuscule", valid: /[A-Z]/.test(newPassword) },
    { label: "Une minuscule", valid: /[a-z]/.test(newPassword) },
    { label: "Un chiffre", valid: /\d/.test(newPassword) },
    { label: "Un caractère spécial", valid: /[/*@#._!$%^&+=-]/.test(newPassword) },
  ];
  const passwordIsStrong = passwordRules.every((rule) => rule.valid);

  const savePreference = (key, value, message) => {
    updatePreference(key, value);
    setToastMsg(message);
    setToast(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    if (!passwordIsStrong) {
      setPwdError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/auth/password/change", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setToastMsg("Mot de passe modifié avec succès.");
      setToast(true);
    } catch (err) {
      setPwdError(err.response?.data?.detail || "Erreur lors du changement de mot de passe");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Profil" }, { label: "Paramètres" }]} />

      <div className="page-head">
        <div>
          <h2>Paramètres du Compte</h2>
          <p className="muted">Profil, sécurité et préférences.</p>
        </div>
      </div>

      <div className="grid two-col">
        <div className="card">
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 28 }}>{initials}</div>
            <div>
              <h2 style={{ margin: 0 }}>{displayName}</h2>
              <p className="muted">{user?.email}</p>
              <span className={`role-pill ${user?.role}`}>{user?.roleLabel || user?.role}</span>
            </div>
          </div>

          <h3>Informations du profil</h3>
          <div className="form-grid">
            <label>
              Nom complet
              <input className="field" defaultValue={displayName} readOnly />
            </label>
            <label>
              Adresse email
              <input className="field" defaultValue={user?.email} readOnly />
            </label>
            <label>
              Rôle
              <input className="field" defaultValue={user?.role} readOnly />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Pour modifier votre nom ou email, contactez un administrateur.
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <h3>Préférences</h3>
            <div className="settings-row">
              <div>
                <strong>Langue de l'application</strong>
                <p className="muted">Cette préférence est conservé sur ce navigateur.</p>
              </div>
              <select
                className="field settings-control"
                value={preferences.language || "fr"}
                onChange={(e) => savePreference("language", e.target.value, "Langue mise Ã  jour.")}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="settings-row">
              <div>
                <strong>Notifications</strong>
                <p className="muted">Active ou dÃ©sactive les notifications locales de l'interface.</p>
              </div>
              <label className="switch" aria-label="Activer les notifications">
                <input
                  type="checkbox"
                  checked={preferences.notificationsEnabled !== false}
                  onChange={(e) =>
                    savePreference(
                      "notificationsEnabled",
                      e.target.checked,
                      e.target.checked ? "Notifications activÃ©es." : "Notifications dÃ©sactivÃ©es."
                    )
                  }
                />
                <span />
              </label>
            </div>
          </div>

          <div className="card">
            <h3>Changer le mot de passe</h3>
            {pwdError && (
              <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{pwdError}</p>
            )}
            <form onSubmit={handleChangePassword} className="form-grid">
              <label className="full">
                Mot de passe actuel
                <input
                  type="password"
                  className="field"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="full">
                Nouveau mot de passe (min. 8 caractères)
                <input
                  type="password"
                  className="field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <div className="password-rules full">
                {passwordRules.map((rule) => (
                  <span key={rule.label} className={rule.valid ? "valid" : ""}>
                    {rule.valid ? "✓" : "•"} {rule.label}
                  </span>
                ))}
              </div>
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn primary" type="submit" disabled={pwdLoading}>
                  {pwdLoading ? "Modification…" : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3>Session</h3>
            <p className="muted">
              Connecté en tant que <strong>{displayName}</strong> avec le rôle <strong>{user?.role}</strong>.
            </p>
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn" style={{ color: "var(--danger)" }} onClick={logout}>
                 Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast show={toast} message={toastMsg} sub="Paramètres du compte" />
    </div>
  );
}
