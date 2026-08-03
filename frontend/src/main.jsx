import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Briefcase, CalendarDays, GraduationCap, Lock, LogIn, Plus, ShieldCheck, UserPlus, Users, Wallet, ClipboardList, Building2 } from "lucide-react";
import "./styles.css";
import "./styles/design-tokens.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [message, setMessage] = useState("");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  async function loadDashboard(accessToken = token) {
    if (!accessToken) {
      setCourses([]);
      setMyCourses([]);
      setPrograms([]);
      setInvoices([]);
      setCampaigns([]);
      setEmployees([]);
      setAssets([]);
      setPayrolls([]);
      return;
    }

    const [coursesResponse, enrolledResponse, programsResponse, invoicesResponse, campaignsResponse, employeesResponse, assetsResponse, payrollsResponse] = await Promise.all([
      fetch(`${API_URL}/courses`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/me/enrollments`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/programs`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/finance/invoices`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/marketing/campaigns`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/hr/employees`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/hr/assets`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/hr/payrolls`, { headers: { ...authHeaders, Authorization: `Bearer ${accessToken}` } }),
    ]);

    const coursesData = await coursesResponse.json().catch(() => []);
    const enrolledData = await enrolledResponse.json().catch(() => []);
    const programsData = await programsResponse.json().catch(() => []);
    const invoicesData = await invoicesResponse.json().catch(() => []);
    const campaignsData = await campaignsResponse.json().catch(() => []);
    const employeesData = await employeesResponse.json().catch(() => []);
    const assetsData = await assetsResponse.json().catch(() => []);
    const payrollsData = await payrollsResponse.json().catch(() => []);

    if (coursesResponse.ok) setCourses(coursesData);
    if (enrolledResponse.ok) setMyCourses(enrolledData);
    if (programsResponse.ok) setPrograms(programsData);
    if (invoicesResponse.ok) setInvoices(invoicesData);
    if (campaignsResponse.ok) setCampaigns(campaignsData);
    if (employeesResponse.ok) setEmployees(employeesData);
    if (assetsResponse.ok) setAssets(assetsData);
    if (payrollsResponse.ok) setPayrolls(payrollsData);
  }

  useEffect(() => {
    if (token) {
      void loadDashboard(token);
    }
  }, [token]);

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
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Connexion impossible");
      return;
    }

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    setMessage(`Connecté en tant que ${data.user.role}`);
    await loadDashboard(data.access_token);
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
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Inscription impossible");
      return;
    }

    setMode("login");
    setMessage(`Compte ${data.role} créé. Vous pouvez vous connecter.`);
  }

  async function createCourse(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/courses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: form.get("title"),
        code: form.get("code"),
        description: form.get("description"),
        teacher_name: form.get("teacher_name"),
        credits: Number(form.get("credits") || 3),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création du cours impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Cours ${data.title} créé avec succès`);
    await loadDashboard(token);
  }

  async function createProgram(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/programs`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: form.get("name"),
        level: form.get("level"),
        duration_years: Number(form.get("duration_years") || 3),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création du programme impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Programme ${data.name} créé`);
    await loadDashboard(token);
  }

  async function createAssignment(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const courseId = form.get("course_id");
    const response = await fetch(`${API_URL}/courses/${courseId}/assignments`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        due_date: form.get("due_date"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création du devoir impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Devoir ${data.title} publié`);
    await loadDashboard(token);
  }

  async function createInvoice(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/finance/invoices`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        student_email: form.get("student_email"),
        description: form.get("description"),
        amount: Number(form.get("amount") || 0),
        due_date: form.get("due_date"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création de la facture impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Facture ${data.invoice_number} créée`);
    await loadDashboard(token);
  }

  async function createCampaign(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/marketing/campaigns`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: form.get("name"),
        channel: form.get("channel"),
        start_date: form.get("start_date"),
        end_date: form.get("end_date"),
        budget: Number(form.get("budget") || 0),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création de la campagne impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Campagne ${data.name} créée`);
    await loadDashboard(token);
  }

  async function createEmployee(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/hr/employees`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        user_email: form.get("user_email"),
        employee_number: form.get("employee_number"),
        department: form.get("department"),
        hire_date: form.get("hire_date"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création de l'employé impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Employé ${data.employee_number} ajouté`);
    await loadDashboard(token);
  }

  async function createAsset(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/hr/assets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: form.get("name"),
        category: form.get("category"),
        serial_number: form.get("serial_number"),
        acquisition_date: form.get("acquisition_date"),
        status: form.get("status"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création de l'actif impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Actif ${data.name} enregistré`);
    await loadDashboard(token);
  }

  async function createPayroll(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/hr/payrolls`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        contract_id: Number(form.get("contract_id") || 0),
        period: form.get("period"),
        gross_salary: Number(form.get("gross_salary") || 0),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Création de la paie impossible");
      return;
    }

    event.currentTarget.reset();
    setMessage(`Paie ${data.period} générée`);
    await loadDashboard(token);
  }

  async function enroll(courseId) {
    setMessage("");
    const response = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: authHeaders,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Inscription impossible");
      return;
    }

    setMessage(`Vous êtes inscrit au cours ${courseId}`);
    await loadDashboard(token);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setCourses([]);
    setMyCourses([]);
    setPrograms([]);
    setInvoices([]);
    setCampaigns([]);
    setEmployees([]);
    setAssets([]);
    setPayrolls([]);
    setMessage("Session terminée");
  }

  return (
    <main className="app-shell">
      <section className="auth-panel">
        <div className="brand-row">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h1>CampusWorkflow</h1>
            <p>ERP académique, marketing, finance et RH</p>
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
              <input name="password" type="password" required />
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
              Rôle
              <select name="role" defaultValue="Student">
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </label>
            <button className="primary-button" type="submit">
              <UserPlus size={18} />
              Créer le compte
            </button>
          </form>
        )}

        {message && <p className="status-message">{message}</p>}
      </section>

      <section className="session-panel">
        <div className="section-title">
          <Users aria-hidden="true" />
          <h2>Tableau de bord</h2>
        </div>

        {user ? (
          <div className="dashboard-grid">
            <div className="section-card welcome-card">
              <div className="section-title">
                <GraduationCap aria-hidden="true" />
                <h3>{user.name}</h3>
              </div>
              <p>{user.email}</p>
              <span className="role-badge">{user.role}</span>
              <p className="muted">Bienvenue sur CampusWorkflow, votre ERP prêt à piloter les modules académiques, financiers et RH.</p>
              <button className="ghost-button" onClick={logout}>Déconnexion</button>
            </div>

            <div className="section-card">
              <div className="section-title">
                <BookOpen aria-hidden="true" />
                <h3>Mes cours</h3>
              </div>
              {myCourses.length > 0 ? (
                <div className="course-list">
                  {myCourses.map((course) => (
                    <div key={course.id} className="course-card">
                      <div>
                        <strong>{course.title}</strong>
                        <p>{course.code}</p>
                      </div>
                      <span className="pill">Inscrit</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Aucun cours pour le moment. Inscrivez-vous depuis la liste ci-dessous.</p>
              )}
            </div>

            <div className="section-card">
              <div className="section-title">
                <CalendarDays aria-hidden="true" />
                <h3>Cours disponibles</h3>
              </div>
              <div className="course-list">
                {courses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div>
                      <strong>{course.title}</strong>
                      <p>{course.code} • {course.teacher_name || "Enseignant"}</p>
                      <span className="muted">{course.description}</span>
                    </div>
                    <button className="secondary-button" onClick={() => enroll(course.id)}>
                      S'inscrire
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="section-title">
                <ClipboardList aria-hidden="true" />
                <h3>Programmes académiques</h3>
              </div>
              <div className="course-list">
                {programs.map((program) => (
                  <div key={program.id} className="course-card">
                    <div>
                      <strong>{program.name}</strong>
                      <p>{program.level} • {program.duration_years} ans</p>
                    </div>
                    <span className="pill">Programme</span>
                  </div>
                ))}
              </div>
            </div>

            {user.role !== "Student" && (
              <>
                <div className="section-card">
                  <div className="section-title">
                    <Plus aria-hidden="true" />
                    <h3>Ajouter un cours</h3>
                  </div>
                  <form onSubmit={createCourse} className="form-stack compact-form">
                    <label>
                      Titre
                      <input name="title" required />
                    </label>
                    <label>
                      Code
                      <input name="code" required />
                    </label>
                    <label>
                      Description
                      <input name="description" />
                    </label>
                    <label>
                      Enseignant
                      <input name="teacher_name" />
                    </label>
                    <label>
                      Crédits
                      <input name="credits" type="number" defaultValue="3" />
                    </label>
                    <button className="primary-button" type="submit">Publier le cours</button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-title">
                    <Plus aria-hidden="true" />
                    <h3>Créer un programme</h3>
                  </div>
                  <form onSubmit={createProgram} className="form-stack compact-form">
                    <label>
                      Nom
                      <input name="name" required />
                    </label>
                    <label>
                      Niveau
                      <input name="level" defaultValue="Undergraduate" />
                    </label>
                    <label>
                      Durée (ans)
                      <input name="duration_years" type="number" defaultValue="3" />
                    </label>
                    <button className="primary-button" type="submit">Enregistrer</button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-title">
                    <Plus aria-hidden="true" />
                    <h3>Publier un devoir</h3>
                  </div>
                  <form onSubmit={createAssignment} className="form-stack compact-form">
                    <label>
                      Cours
                      <select name="course_id" defaultValue="">
                        <option value="" disabled>Choisir un cours</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Titre
                      <input name="title" required />
                    </label>
                    <label>
                      Description
                      <input name="description" />
                    </label>
                    <label>
                      Date limite
                      <input name="due_date" type="datetime-local" required />
                    </label>
                    <button className="primary-button" type="submit">Publier le devoir</button>
                  </form>
                </div>
              </>
            )}

            <div className="section-card">
              <div className="section-title">
                <Wallet aria-hidden="true" />
                <h3>Finance & marketing</h3>
              </div>
              <div className="course-list">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="course-card">
                    <div>
                      <strong>{invoice.invoice_number}</strong>
                      <p>{invoice.status} • {invoice.total_amount} FCFA</p>
                    </div>
                    <span className="pill">Facture</span>
                  </div>
                ))}
              </div>
              <div className="course-list">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="course-card">
                    <div>
                      <strong>{campaign.name}</strong>
                      <p>{campaign.channel} • budget {campaign.budget}</p>
                    </div>
                    <span className="pill">Campagne</span>
                  </div>
                ))}
              </div>
            </div>

            {user.role !== "Student" && (
              <>
                <div className="section-card">
                  <div className="section-title">
                    <Wallet aria-hidden="true" />
                    <h3>Créer une facture</h3>
                  </div>
                  <form onSubmit={createInvoice} className="form-stack compact-form">
                    <label>
                      Email étudiant
                      <input name="student_email" required />
                    </label>
                    <label>
                      Description
                      <input name="description" required />
                    </label>
                    <label>
                      Montant
                      <input name="amount" type="number" required />
                    </label>
                    <label>
                      Date échéance
                      <input name="due_date" type="datetime-local" required />
                    </label>
                    <button className="primary-button" type="submit">Générer la facture</button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-title">
                    <Briefcase aria-hidden="true" />
                    <h3>Créer une campagne</h3>
                  </div>
                  <form onSubmit={createCampaign} className="form-stack compact-form">
                    <label>
                      Nom
                      <input name="name" required />
                    </label>
                    <label>
                      Canal
                      <input name="channel" defaultValue="Email" />
                    </label>
                    <label>
                      Début
                      <input name="start_date" type="datetime-local" required />
                    </label>
                    <label>
                      Fin
                      <input name="end_date" type="datetime-local" required />
                    </label>
                    <label>
                      Budget
                      <input name="budget" type="number" defaultValue="0" />
                    </label>
                    <button className="primary-button" type="submit">Publier</button>
                  </form>
                </div>
              </>
            )}

            <div className="section-card">
              <div className="section-title">
                <Building2 aria-hidden="true" />
                <h3>RH & ressources</h3>
              </div>
              <div className="course-list">
                {employees.map((employee) => (
                  <div key={employee.id} className="course-card">
                    <div>
                      <strong>{employee.employee_number}</strong>
                      <p>{employee.department}</p>
                    </div>
                    <span className="pill">Employé</span>
                  </div>
                ))}
              </div>
              <div className="course-list">
                {assets.map((asset) => (
                  <div key={asset.id} className="course-card">
                    <div>
                      <strong>{asset.name}</strong>
                      <p>{asset.category} • {asset.status}</p>
                    </div>
                    <span className="pill">Actif</span>
                  </div>
                ))}
              </div>
              <div className="course-list">
                {payrolls.map((payroll) => (
                  <div key={payroll.id} className="course-card">
                    <div>
                      <strong>{payroll.period}</strong>
                      <p>Net {payroll.net_salary}</p>
                    </div>
                    <span className="pill">Paie</span>
                  </div>
                ))}
              </div>
            </div>

            {user.role !== "Student" && (
              <>
                <div className="section-card">
                  <div className="section-title">
                    <Briefcase aria-hidden="true" />
                    <h3>Ajouter un employé</h3>
                  </div>
                  <form onSubmit={createEmployee} className="form-stack compact-form">
                    <label>
                      Email utilisateur
                      <input name="user_email" required />
                    </label>
                    <label>
                      Matricule
                      <input name="employee_number" required />
                    </label>
                    <label>
                      Département
                      <input name="department" />
                    </label>
                    <label>
                      Date d'embauche
                      <input name="hire_date" type="datetime-local" required />
                    </label>
                    <button className="primary-button" type="submit">Enregistrer</button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-title">
                    <Building2 aria-hidden="true" />
                    <h3>Enregistrer un actif</h3>
                  </div>
                  <form onSubmit={createAsset} className="form-stack compact-form">
                    <label>
                      Nom
                      <input name="name" required />
                    </label>
                    <label>
                      Catégorie
                      <input name="category" defaultValue="IT" />
                    </label>
                    <label>
                      Numéro de série
                      <input name="serial_number" required />
                    </label>
                    <label>
                      Date d'acquisition
                      <input name="acquisition_date" type="datetime-local" required />
                    </label>
                    <label>
                      Statut
                      <input name="status" defaultValue="Available" />
                    </label>
                    <button className="primary-button" type="submit">Enregistrer</button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-title">
                    <Briefcase aria-hidden="true" />
                    <h3>Générer une paie</h3>
                  </div>
                  <form onSubmit={createPayroll} className="form-stack compact-form">
                    <label>
                      ID contrat
                      <input name="contract_id" type="number" required />
                    </label>
                    <label>
                      Période
                      <input name="period" required />
                    </label>
                    <label>
                      Salaire brut
                      <input name="gross_salary" type="number" required />
                    </label>
                    <button className="primary-button" type="submit">Générer</button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="empty-state">Connectez-vous pour accéder à votre portail d’apprentissage et à l’ERP complet.</p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

