import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TitleUpdater } from "@/components/TitleUpdater";

import LandingPage from "@/pages/LandingPage";
import ApplicantLogin from "@/pages/applicant/ApplicantLogin";
import ApplicantRegister from "@/pages/applicant/ApplicantRegister";
import CompanyLogin from "@/pages/company/CompanyLogin";
import CompanyRegister from "@/pages/company/CompanyRegister";

function App() {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <AuthProvider>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Applicant auth */}
          <Route path="/applicant/login" element={<ApplicantLogin />} />
          <Route path="/applicant/register" element={<ApplicantRegister />} />

          {/* Company / Recruiter auth */}
          <Route path="/company/login" element={<CompanyLogin />} />
          <Route path="/company/register" element={<CompanyRegister />} />

          {/* Placeholder dashboards — replace when ready */}
          <Route
            path="/applicant/dashboard"
            element={
              <div className="min-h-screen flex items-center justify-center text-gray-600">
                🎉 Applicant Dashboard — coming soon
              </div>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <div className="min-h-screen flex items-center justify-center text-gray-600">
                🎉 Company Dashboard — coming soon
              </div>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
