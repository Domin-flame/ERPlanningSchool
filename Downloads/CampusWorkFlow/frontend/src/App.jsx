import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Splash from "./pages/auth/Splash.jsx";
import Login from "./pages/auth/Login.jsx";
import Onboarding from "./pages/auth/Onboarding.jsx";

import Dashboard from "./pages/academic/Dashboard.jsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import MarketingDashboard from "./pages/finance/MarketingDashboard.jsx";
import HR from "./pages/rh/HR.jsx";
import Finance from "./pages/finance/Finance.jsx";

import Students from "./pages/academic/Students.jsx";
import Courses from "./pages/general/Courses.jsx";
import Calendar from "./pages/general/Calendar.jsx";
import Messages from "./pages/message/Messages.jsx";
import Analytics from "./pages/general/Analytics.jsx";
import Settings from "./pages/auth/Settings.jsx";
import Forbidden from "./pages/general/Forbidden.jsx";

/**
 * Retourne le dashboard home pour le rôle connecté.
 * Chaque rôle a exactement un dashboard de destination — aucune ambiguïté.
 */
function HomeDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case "professeur":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "rh":
      return <HR />;
    case "finance":
      return <Finance />;
    case "marketing":
      return <MarketingDashboard />;
    case "academic":
    default:
      return <Dashboard />;
  }
}

function MainRoutes() {
  return (
    <Routes>
      {/* Écrans d'accueil / auth — publics */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Application principale avec Layout + auth obligatoire */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard dynamique selon le rôle — chaque rôle voit son propre dashboard */}
        <Route path="/" element={<HomeDashboard />} />

        {/* Dashboards spécifiques aux rôles */}
        <Route
          path="/professeur"
          element={
            <ProtectedRoute allowedRoles={["professeur", "academic"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student", "academic"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={["marketing", "academic"]}>
              <MarketingDashboard />
            </ProtectedRoute>
          }
        />
        {/* Finance : UNIQUEMENT finance et direction — les étudiants n'ont pas accès */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={["finance", "academic"]}>
              <Finance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["rh", "academic"]}>
              <HR />
            </ProtectedRoute>
          }
        />

        {/* Outils communs — accessibles selon la navigation de rôle définie dans Layout */}
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={["academic", "professeur", "rh", "finance"]}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={["academic", "professeur", "student", "rh"]}>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/messages" element={<Messages />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["academic", "rh", "finance", "marketing"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Toute route inconnue → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Show splash for 2.5 seconds on startup
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        {showSplash ? <Splash /> : <MainRoutes />}
      </DataProvider>
    </AuthProvider>
  );
}
