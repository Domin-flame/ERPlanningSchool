import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthProvider.jsx";
import { ToastProvider } from "../context/ToastProvider.jsx";
import { NotificationsProvider } from "../context/NotificationsProvider.jsx";
import { PublicOnly, RequireAuth, RequireRole } from "../components/routing/guards.jsx";
import { PageLoader } from "../components/ui";
import AppLayout from "../layouts/AppLayout.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import { LEGACY_REDIRECTS } from "./roles.js";

// Les écrans métier sont chargés à la demande pour alléger le bundle initial.
const RegisterPage = lazy(() => import("../features/auth/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../features/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../features/auth/ResetPasswordPage.jsx"));
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage.jsx"));
const StudentsPage = lazy(() => import("../features/academic/StudentsPage.jsx"));
const CoursesPage = lazy(() => import("../features/academic/CoursesPage.jsx"));
const StudentCoursesPage = lazy(() => import("../features/student/StudentCoursesPage.jsx"));
const StudentGradesPage = lazy(() => import("../features/student/StudentGradesPage.jsx"));
const StudentInvoicesPage = lazy(() => import("../features/student/StudentInvoicesPage.jsx"));
const TeachingPage = lazy(() => import("../features/teacher/TeachingPage.jsx"));
const EmployeesPage = lazy(() => import("../features/hr/EmployeesPage.jsx"));
const LeavesPage = lazy(() => import("../features/hr/LeavesPage.jsx"));
const AccountsPage = lazy(() => import("../features/hr/AccountsPage.jsx"));
const InvoicesPage = lazy(() => import("../features/finance/InvoicesPage.jsx"));
const LeadsPage = lazy(() => import("../features/marketing/LeadsPage.jsx"));
const CampaignsPage = lazy(() => import("../features/marketing/CampaignsPage.jsx"));
const MessagesPage = lazy(() => import("../features/messages/MessagesPage.jsx"));
const NotificationsPage = lazy(() => import("../features/notifications/NotificationsPage.jsx"));
const CalendarPage = lazy(() => import("../features/calendar/CalendarPage.jsx"));
const AssistantPage = lazy(() => import("../features/assistant/AssistantPage.jsx"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage.jsx"));
const NotFoundPage = lazy(() => import("../features/errors/ErrorPages.jsx").then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import("../features/errors/ErrorPages.jsx").then((m) => ({ default: m.ForbiddenPage })));

/** Routes protégées : chaque chemin est contrôlé via ROUTE_ACCESS (app/roles.js). */
const PROTECTED_ROUTES = [
  ["/dashboard", DashboardPage],
  ["/calendar", CalendarPage],
  ["/messages", MessagesPage],
  ["/notifications", NotificationsPage],
  ["/assistant", AssistantPage],
  ["/settings", SettingsPage],
  ["/academic/students", StudentsPage],
  ["/academic/courses", CoursesPage],
  ["/student/courses", StudentCoursesPage],
  ["/student/grades", StudentGradesPage],
  ["/student/invoices", StudentInvoicesPage],
  ["/teaching", TeachingPage],
  ["/hr/employees", EmployeesPage],
  ["/hr/leaves", LeavesPage],
  ["/hr/accounts", AccountsPage],
  ["/finance/invoices", InvoicesPage],
  ["/marketing/leads", LeadsPage],
  ["/marketing/campaigns", CampaignsPage],
];

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {PROTECTED_ROUTES.map(([path, Page]) => (
            <Route key={path} path={path} element={<RequireRole path={path}><Page /></RequireRole>} />
          ))}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationsProvider>
          <AppRoutes />
        </NotificationsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
