import { Navigate } from "react-router-dom";
import { ONBOARDING_STORAGE_KEY } from "../../app/access.js";

export default function EntryRedirect() {
  const hasSeenOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  return <Navigate to={hasSeenOnboarding ? "/login" : "/onboarding"} replace />;
}
