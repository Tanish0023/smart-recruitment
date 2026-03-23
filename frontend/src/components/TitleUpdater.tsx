import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
    "/": "Smart Recruitment | Home",
    "/applicant/login": "Applicant Login | Smart Recruitment",
    "/applicant/register": "Applicant Register | Smart Recruitment",
    "/applicant/verify-otp": "Applicant OTP Verification | Smart Recruitment",
    "/company/login": "Company Login | Smart Recruitment",
    "/company/register": "Company Register | Smart Recruitment",
    "/company/verify-otp": "Company OTP Verification | Smart Recruitment",
    "/applicant/dashboard": "Applicant Dashboard | Smart Recruitment",
    "/company/dashboard": "Company Dashboard | Smart Recruitment",
};

export function TitleUpdater() {
    const location = useLocation();

    useEffect(() => {
        const title = routeTitles[location.pathname] || "Smart Recruitment";
        document.title = title;
    }, [location]);

    return null;
}
