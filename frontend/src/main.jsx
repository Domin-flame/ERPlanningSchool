import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Lock, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [message, setMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  async function login(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.detail || "Connexion impossible");
      return;
    }

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    setMessage(`Connecte en tant que ${data.user.role}`);
  }

  async function register(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.detail || "Inscription impossible");
      return;
    }

    setMode("login");
    setMessage(`Compte ${data.role} cree. Vous pouvez vous connecter.`);
  }

  async function openAdminPage() {
    setAdminMessage("");
    const response = await fetch(`${API_URL}/admin/secret`, {
      headers: authHeaders,
    });
    const data = await response.json();

    if (!response.ok) {
      setAdminMessage(data.detail || "Acces refuse");
      return;
    }

    setAdminMessage(data.message);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setAdminMessage("");
    setMessage("Session terminee");
  }

  return (
    <main className="app-shell">
      <section className="auth-panel">
        <div className="brand-row">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h1>CampusWorkflow</h1>
            <p>Portail de gestion universitaire</p>
          </div>
        </div>

        <div className="mode-switch" aria-label="Choisir une action">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            <LogIn size={18} />
            Connexion
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            <UserPlus size={18} />
            Inscription
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={login} className="form-stack">
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Mot de passe
              <input name="password" type="password"  required />
            </label>
            <button className="primary-button" type="submit">
              <Lock size={18} />
              Se connecter
            </button>
          </form>
        ) : (
          <form onSubmit={register} className="form-stack">
            <label>
              Nom
              <input name="name" type="text" placeholder="Votre nom" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="adresse@gmail.com" required />
            </label>
            <label>
              Mot de passe
              <input name="password" type="password" minLength="8" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="Student">
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <button className="primary-button" type="submit">
              <UserPlus size={18} />
              Creer le compte
            </button>
          </form>
        )}

        {message && <p className="status-message">{message}</p>}
      </section>

      <section className="session-panel">
        <div className="section-title">
          <Users aria-hidden="true" />
          <h2>Session active</h2>
        </div>

        {user ? (
          <div className="session-details">
            <p>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </p>
            <span className="role-badge">{user.role}</span>

            <h1>Bienvenue sur CampusWorkflow</h1>

            <button className="secondary-button" onClick={openAdminPage}>
              <ShieldCheck size={18} />
              Tester page Admin
            </button>
            {adminMessage && <p className="status-message">{adminMessage}</p>}
            <button className="ghost-button" onClick={logout}>Deconnexion</button>
          </div>
        ) : (
          <p className="empty-state">Connectez-vous pour accéder à votre portail</p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

