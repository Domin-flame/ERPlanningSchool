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
import StudentCourseCatalog from "./pages/student/StudentCourseCatalog.jsx";
import MarketingDashboard from "./pages/finance/MarketingDashboard.jsx";
import HR from "./pages/rh/HR.jsx";
import Finance from "./pages/finance/Finance.jsx";

import Students from "./pages/academic/Students.jsx";
import Courses from "./pages/general/Courses.jsx";
import Calendar from "./pages/general/Calendar.jsx";
import Messages from "./pages/message/Messages.jsx";
import Chatbot from "./pages/general/Chatbot.jsx";
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
          element={roleRoute("/professeur", <TeacherDashboard />)}
        />
        <Route
          path="/student"
          element={roleRoute("/student", <StudentDashboard />)}
        />
        <Route
          path="/student/transcript"
          element={roleRoute("/student/transcript", <Transcript />)}
        />
        <Route
          path="/student/courses"
          element={roleRoute("/student/courses", <StudentCourseCatalog />)}
        />
        <Route
          path="/marketing"
          element={roleRoute("/marketing", <MarketingDashboard />)}
        />
        <Route
          path="/finance"
          element={roleRoute("/finance", <Finance />)}
        />
        <Route path="/hr" element={roleRoute("/hr", <HR />)} />
        <Route
          path="/students"
          element={roleRoute("/students", <Students />)}
        />
        <Route
          path="/courses"
          element={roleRoute("/courses", <Courses />)}
        />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chatbot" element={roleRoute("/chatbot", <Chatbot />)} />
        <Route path="/notifications" element={<Notification />} />
        <Route
          path="/analytics"
          element={roleRoute("/analytics", <Analytics />)}
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function roleRoute(path, page) {
  return <ProtectedRoute allowedRoles={ROUTE_ACCESS[path]}>{page}</ProtectedRoute>;
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
