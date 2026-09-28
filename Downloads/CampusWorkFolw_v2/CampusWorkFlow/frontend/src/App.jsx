import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import { ROUTE_ACCESS } from "./app/access.js";

import EntryRedirect from "./pages/auth/EntryRedirect.jsx";
import Login from "./pages/auth/Login.jsx";
import Onboarding from "./pages/auth/Onboarding.jsx";

import Dashboard from "./pages/academic/Dashboard.jsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import Transcript from "./pages/student/Transcript.jsx";
import MarketingDashboard from "./pages/finance/MarketingDashboard.jsx";
import HR from "./pages/rh/HR.jsx";
import Finance from "./pages/finance/Finance.jsx";

import Students from "./pages/academic/Students.jsx";
import Courses from "./pages/general/Courses.jsx";
import Calendar from "./pages/general/Calendar.jsx";
import Messages from "./pages/message/Messages.jsx";
import Notification from "./pages/notification/Notification.jsx";
import Analytics from "./pages/general/Analytics.jsx";
import Settings from "./pages/auth/Settings.jsx";

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
      {/* Routes publiques */}
      <Route path="/splash" element={<EntryRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeDashboard />} />
        <Route
          path="/professeur"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/professeur"]}><TeacherDashboard /></RoleRoute>}
        />
        <Route
          path="/student"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/student"]}><StudentDashboard /></RoleRoute>}
        />
        <Route
          path="/student/transcript"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/student/transcript"]}><Transcript /></RoleRoute>}
        />
        <Route
          path="/marketing"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/marketing"]}><MarketingDashboard /></RoleRoute>}
        />
        <Route
          path="/finance"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/finance"]}><Finance /></RoleRoute>}
        />
        <Route path="/hr" element={<RoleRoute allowedRoles={ROUTE_ACCESS["/hr"]}><HR /></RoleRoute>} />
        <Route
          path="/students"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/students"]}><Students /></RoleRoute>}
        />
        <Route
          path="/courses"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/courses"]}><Courses /></RoleRoute>}
        />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notification />} />
        <Route
          path="/analytics"
          element={<RoleRoute allowedRoles={ROUTE_ACCESS["/analytics"]}><Analytics /></RoleRoute>}
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleRoute({ allowedRoles, children }) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainRoutes />
      </DataProvider>
    </AuthProvider>
  );
}
