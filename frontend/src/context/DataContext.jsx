import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const DataContext = createContext();

/**
 * Formate une date ISO en libellé relatif court (français).
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ === 1) return "Hier";
  if (diffJ < 7) return `Il y a ${diffJ} j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/**
 * DataContext — source de vérité unique pour les données métier.
 * Toutes les données viennent de l'API backend ; aucune donnée mock.
 * Le chargement ne démarre qu'après authentification de l'utilisateur.
 */
export function DataProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  // --- État des données ---
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [leads, setLeads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [studentOverview, setStudentOverview] = useState(null);

  // --- État de chargement global ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Barre de recherche globale
  const [searchQuery, setSearchQuery] = useState("");
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cw_preferences")) || {
        language: "fr",
        notificationsEnabled: true,
      };
    } catch {
      return { language: "fr", notificationsEnabled: true };
    }
  });

  // ----- Chargement des données selon le rôle -----
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    setErrors({});
    const role = user.role;

    const safeGet = async (url, setter, key) => {
      try {
        const res = await api.get(url);
        const data = res.data;
        setter(Array.isArray(data) ? data : (data?.items ?? data?.results ?? []));
      } catch (err) {
        setErrors((prev) => ({ ...prev, [key]: err.response?.data?.detail || "Erreur de chargement" }));
      }
    };

    // Chargement conditionnel selon le rôle
    const tasks = [];

    if (["academic", "professeur"].includes(role)) {
      tasks.push(safeGet("/academic/courses/", setCourses, "courses"));
    }
    if (role === "student") {
      tasks.push(
        (async () => {
          try {
            const res = await api.get("/academic/student/me/overview");
            setStudentOverview(res.data);
            setCourses(res.data.courses || []);
          } catch (err) {
            setErrors((prev) => ({ ...prev, studentOverview: err.response?.data?.detail || "Erreur de chargement du portail étudiant" }));
          }
        })()
      );
      tasks.push(safeGet("/finance/students/me/invoices", setInvoices, "invoices"));
    }
    if (["academic", "professeur"].includes(role)) {
      tasks.push(safeGet("/academic/students/", setStudents, "students"));
    }
    if (["academic", "rh"].includes(role)) {
      tasks.push(safeGet("/hr/employees/", setEmployees, "employees"));
    }
    if (["academic", "finance"].includes(role)) {
      tasks.push(safeGet("/finance/invoices", setInvoices, "invoices"));
    }
    if (["academic", "marketing"].includes(role)) {
      tasks.push(safeGet("/marketing/leads", setLeads, "leads"));
    }

    // Notifications — disponibles pour tous les rôles authentifiés
    tasks.push(
      (async () => {
        try {
          const res = await api.get("/notifications", { params: { limit: 30 } });
          const items = res.data?.items ?? res.data ?? [];
          setNotifications(
            items.map((n) => ({
              id: n.id,
              title: n.title,
              desc: n.message,
              time: formatRelativeTime(n.created_at),
              unread: !n.read,
              type: n.type || "info",
              category: n.category || "system",
            }))
          );
        } catch (err) {
          setErrors((prev) => ({ ...prev, notifications: err.response?.data?.detail || "Erreur de chargement des notifications" }));
        }
      })()
    );

    // Conversations personnelles : le service ne renvoie que celles dont
    // l'utilisateur authentifié est participant.
    tasks.push(
      (async () => {
        try {
          const res = await api.get("/messages/conversations/", { params: { limit: 50 } });
          const items = res.data?.items ?? res.data ?? [];
          setConversations(items.map((conversation) => ({
            ...conversation,
            lastMessage: conversation.last_message,
            unreadCount: conversation.unread,
          })));
        } catch (err) {
          setErrors((prev) => ({ ...prev, conversations: err.response?.data?.detail || "Erreur de chargement des conversations" }));
        }
      })()
    );

    await Promise.allSettled(tasks);
    setLoading(false);
  }, [isAuthenticated, user]);

  // Recharger à chaque changement d'authentification
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      // Vider les données à la déconnexion
      setCourses([]);
      setStudents([]);
      setEmployees([]);
      setInvoices([]);
      setLeads([]);
      setNotifications([]);
      setConversations([]);
      setStudentOverview(null);
      setErrors({});
    }
  }, [isAuthenticated, loadData]);

  const refreshData = () => loadData();

  const updatePreference = (key, value) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("cw_preferences", JSON.stringify(next));
      return next;
    });
  };

  // --- Gestion des cours ---
  const addCourse = async (newCourse) => {
    try {
      const res = await api.post("/academic/courses/", newCourse);
      setCourses((prev) => [res.data, ...prev]);
      addNotificationLocal({
        title: "Nouveau cours créé",
        desc: `Le cours ${res.data.code || newCourse.code} - ${res.data.title || newCourse.title} a été ajouté.`,
        type: "course",
      });
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de créer le cours");
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await api.delete(`/academic/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.course_id !== courseId && c.code !== courseId));
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de supprimer le cours");
    }
  };

  // --- Gestion des étudiants ---
  const addStudent = async (newStudent) => {
    try {
      const res = await api.post("/academic/students/", newStudent);
      setStudents((prev) => [res.data, ...prev]);
      addNotificationLocal({
        title: "Nouvel étudiant inscrit",
        desc: `${res.data.name || newStudent.name} a été enregistré.`,
        type: "student",
      });
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible d'inscrire l'étudiant");
    }
  };

  const updateStudentStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/academic/students/${id}`, { status: newStatus });
      setStudents((prev) => prev.map((s) => (s.student_id === id || s.id === id ? { ...s, ...res.data } : s)));
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de mettre à jour le statut");
    }
  };

  const deleteStudent = async (id) => {
    try {
      await api.delete(`/academic/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.student_id !== id && s.id !== id));
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de supprimer l'étudiant");
    }
  };

  // --- Gestion des employés (RH) ---
  const addEmployee = async (newEmp) => {
    try {
      const res = await api.post("/hr/employees/", newEmp);
      setEmployees((prev) => [res.data, ...prev]);
      addNotificationLocal({
        title: "Nouveau membre RH",
        desc: `${res.data.first_name} ${res.data.last_name} a rejoint le département ${res.data.department}.`,
        type: "hr",
      });
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible d'ajouter l'employé");
    }
  };

  // --- Gestion des factures ---
  const addInvoice = async (newInv) => {
    try {
      const res = await api.post("/finance/invoices", newInv);
      setInvoices((prev) => [res.data, ...prev]);
      addNotificationLocal({
        title: "Facture émise",
        desc: `La facture pour ${newInv.studentName} a été générée.`,
        type: "finance",
      });
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de créer la facture");
    }
  };

  const markInvoicePaid = async (id) => {
    try {
      const res = await api.patch(`/finance/invoices/${id}`, { status: "Payée" });
      setInvoices((prev) => prev.map((inv) => (inv.id_invoice === id || inv.id === id ? { ...inv, ...res.data } : inv)));
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de marquer la facture comme payée");
    }
  };

  // --- Gestion des leads (Marketing) ---
  const addLead = async (newLead) => {
    try {
      const res = await api.post("/marketing/leads", newLead);
      setLeads((prev) => [res.data, ...prev]);
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible d'ajouter le lead");
    }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      const res = await api.patch(`/marketing/leads/${id}`, { status });
      setLeads((prev) => prev.map((l) => (l.id_lead === id || l.id === id ? { ...l, ...res.data } : l)));
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Impossible de mettre à jour le lead");
    }
  };

  // --- Notifications ---
  // Ajout local immédiat (feedback optimiste, ex: juste après la création d'un cours).
  // Préfixe "local-" pour ne jamais entrer en conflit avec un id UUID venant du backend.
  const addNotificationLocal = (notif) => {
    if (preferences.notificationsEnabled === false) return;
    const item = {
      id: `local-${Date.now()}`,
      title: notif.title,
      desc: notif.desc,
      time: "À l'instant",
      unread: true,
      type: notif.type || "general",
    };
    setNotifications((prev) => [item, ...prev]);
  };

  // Marque une notification précise comme lue (clic sur la notification).
  const markNotificationRead = async (id) => {
    // Mise à jour optimiste
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    if (typeof id === "string" && id.startsWith("local-")) return;
    try {
      await api.post("/notifications/read", { ids: [id] });
    } catch (err) {
      // La notification reste marquée lue côté UI même si la sync échoue ;
      // elle sera resynchronisée au prochain chargement.
      setErrors((prev) => ({ ...prev, notifications: err.response?.data?.detail || "Erreur de synchronisation" }));
    }
  };

  // Marque toutes les notifications comme lues (bouton "Tout lire").
  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await api.post("/notifications/read", { ids: [] });
    } catch (err) {
      setErrors((prev) => ({ ...prev, notifications: err.response?.data?.detail || "Erreur de synchronisation" }));
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];

    const textOf = (value) => String(value ?? "").toLowerCase();
    const matches = (...fields) => fields.some((field) => textOf(field).includes(normalizedSearchQuery));
    const compact = (items) => items.filter(Boolean).join(" · ");

    const courseResults = courses
      .filter((course) => matches(course.code, course.title, course.name, course.teacher, course.module_id))
      .map((course) => ({
        id: `course-${course.course_id || course.id || course.code || course.title}`,
        type: "Cours",
        title: course.title || course.name || course.code || "Cours",
        subtitle: compact([course.code, course.teacher, course.credits ? `${course.credits} crédits` : ""]),
        to: "/courses",
      }));

    const studentResults = students
      .filter((student) => matches(student.full_name, student.name, student.email, student.matricule, student.program_id, student.status))
      .map((student) => ({
        id: `student-${student.student_id || student.id || student.matricule || student.email}`,
        type: "Étudiant",
        title: student.full_name || student.name || student.matricule || "Étudiant",
        subtitle: compact([student.matricule, student.email, student.status]),
        to: "/students",
      }));

    const invoiceResults = invoices
      .filter((invoice) => matches(invoice.reference, invoice.studentName, invoice.student_name, invoice.status, invoice.amount, invoice.category))
      .map((invoice) => ({
        id: `invoice-${invoice.id_invoice || invoice.id || invoice.reference}`,
        type: "Finance",
        title: invoice.reference || invoice.studentName || invoice.student_name || "Facture",
        subtitle: compact([invoice.status, invoice.amount, invoice.due_date]),
        to: "/finance",
      }));

    const employeeResults = employees
      .filter((employee) => matches(employee.full_name, employee.first_name, employee.last_name, employee.email, employee.department, employee.position))
      .map((employee) => ({
        id: `employee-${employee.employee_id || employee.id || employee.email}`,
        type: "RH",
        title: employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employé",
        subtitle: compact([employee.position, employee.department, employee.email]),
        to: "/hr",
      }));

    const leadResults = leads
      .filter((lead) => matches(lead.name, lead.full_name, lead.email, lead.status, lead.source))
      .map((lead) => ({
        id: `lead-${lead.id_lead || lead.id || lead.email}`,
        type: "Marketing",
        title: lead.name || lead.full_name || lead.email || "Prospect",
        subtitle: compact([lead.status, lead.source, lead.email]),
        to: "/marketing",
      }));

    return [...courseResults, ...studentResults, ...invoiceResults, ...employeeResults, ...leadResults].slice(0, 8);
  }, [normalizedSearchQuery, courses, students, invoices, employees, leads]);

  return (
    <DataContext.Provider
      value={{
        loading,
        errors,
        refreshData,
        courses,
        studentOverview,
        addCourse,
        deleteCourse,
        students,
        addStudent,
        updateStudentStatus,
        deleteStudent,
        employees,
        addEmployee,
        invoices,
        addInvoice,
        markInvoicePaid,
        leads,
        addLead,
        updateLeadStatus,
        notifications,
        addNotificationLocal,
        markNotificationRead,
        markAllNotificationsRead,
        preferences,
        updatePreference,
        conversations,
        searchQuery,
        setSearchQuery,
        searchResults,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData doit être utilisé au sein d'un DataProvider");
  }
  return context;
}
