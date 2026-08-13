import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const DataContext = createContext();

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

  // --- État de chargement global ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Barre de recherche globale
  const [searchQuery, setSearchQuery] = useState("");

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

    if (["academic", "professeur", "student"].includes(role)) {
      tasks.push(safeGet("/academic/courses/", setCourses, "courses"));
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
    // Conversations disponibles pour tous (pas de backend dédié pour l'instant)
    setConversations([]);

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
      setErrors({});
    }
  }, [isAuthenticated, loadData]);

  const refreshData = () => loadData();

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

  // --- Notifications locales (feedback immédiat, non persistées en base) ---
  const addNotificationLocal = (notif) => {
    const item = {
      id: Date.now(),
      title: notif.title,
      desc: notif.desc,
      time: "À l'instant",
      unread: true,
      type: notif.type || "general",
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        errors,
        refreshData,
        courses,
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
        markAllNotificationsRead,
        conversations,
        searchQuery,
        setSearchQuery,
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
