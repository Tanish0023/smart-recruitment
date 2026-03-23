import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TitleUpdater } from "@/components/TitleUpdater";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

import ApplicantLogin from "@/pages/applicant/ApplicantLogin";
import ApplicantRegister from "@/pages/applicant/ApplicantRegister";
import ApplicantDashboard from "@/pages/applicant/ApplicantDashboard";
import CompanyLogin from "@/pages/company/CompanyLogin";
import CompanyRegister from "@/pages/company/CompanyRegister";
import CompanyDashboard from "@/pages/company/CompanyDashboard";
import NewLandingPage from "./pages/landing/NewLandingPage/NewLandingPage";
import JobsPage from "@/pages/jobs/JobsPage";
import JobDetailPage from "@/pages/jobs/JobDetailPage";

/* ── Auth Guard helpers ─────────────────────────────── */
function RequireAuth({ children, recruiterOnly = false }: { children: ReactNode; recruiterOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={recruiterOnly ? "/company/login" : "/applicant/login"} replace />;
  if (recruiterOnly && !user?.isRecruiter) return <Navigate to="/applicant/dashboard" replace />;
  if (!recruiterOnly && user?.isRecruiter) return <Navigate to="/company/dashboard" replace />;
  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (user?.isRecruiter) {
      return <Navigate to="/company/dashboard" replace />;
    }
    return <Navigate to="/applicant/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<NewLandingPage />} />

            {/* Public job pages */}
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />

            {/* Applicant auth */}
            <Route path="/applicant/login" element={<RedirectIfAuthenticated><ApplicantLogin /></RedirectIfAuthenticated>} />
            <Route path="/applicant/register" element={<RedirectIfAuthenticated><ApplicantRegister /></RedirectIfAuthenticated>} />

            {/* Applicant dashboard (auth guarded) */}
            <Route
              path="/applicant/dashboard"
              element={
                <RequireAuth>
                  <ApplicantDashboard />
                </RequireAuth>
              }
            />

            {/* Company / Recruiter auth */}
            <Route path="/company/login" element={<CompanyLogin />} />
            <Route path="/company/register" element={<CompanyRegister />} />

            {/* Company dashboard (recruiter only, auth guarded) */}
            <Route
              path="/company/dashboard"
              element={
                <RequireAuth recruiterOnly>
                  <CompanyDashboard />
                </RequireAuth>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <div className="fixed right-4 bottom-4 z-60 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-1 shadow-lg backdrop-blur-sm">
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
