import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import AcademicDashboard from "../academic/AcademicDashboard.jsx";
import StudentDashboard from "../student/StudentDashboard.jsx";
import TeacherDashboard from "../teacher/TeacherDashboard.jsx";
import HrDashboard from "../hr/HrDashboard.jsx";
import FinanceDashboard from "../finance/FinanceDashboard.jsx";
import MarketingDashboard from "../marketing/MarketingDashboard.jsx";

const DASHBOARDS = {
  academic: AcademicDashboard,
  student: StudentDashboard,
  professeur: TeacherDashboard,
  rh: HrDashboard,
  finance: FinanceDashboard,
  marketing: MarketingDashboard,
};

/** Point d'entrée unique : chaque rôle obtient son propre tableau de bord. */
export default function DashboardPage() {
  const { role } = useAuth();
  const Dashboard = DASHBOARDS[role] || AcademicDashboard;
  return <Dashboard />;
}
