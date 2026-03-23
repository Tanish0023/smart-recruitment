import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    RESEND_COMPANY_OTP,
    RESEND_USER_OTP,
    VERIFY_COMPANY_OTP,
    VERIFY_USER_OTP,
} from "@/graphql/auth";

export default function CompanyVerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialValues = useMemo(() => {
        const state = (location.state as { recruiterEmail?: string; companyEmail?: string } | null) || {};
        const storedCompanyEmail = (sessionStorage.getItem("otp_company_email") || "").trim();
        const storedRecruiterEmail = (sessionStorage.getItem("otp_recruiter_email") || "").trim();
        return {
            recruiterEmail: (state.recruiterEmail || "").trim() || storedRecruiterEmail,
            companyEmail: (state.companyEmail || "").trim() || storedCompanyEmail,
        };
    }, [location.state]);

    const [companyOtp, setCompanyOtp] = useState("");
    const [userOtp, setUserOtp] = useState("");
    const [serverError, setServerError] = useState("");
    const [infoMessage, setInfoMessage] = useState("Verify both company and recruiter OTPs.");
    const [isCompanyVerified, setIsCompanyVerified] = useState(false);
    const [isUserVerified, setIsUserVerified] = useState(false);

    const [verifyCompanyOtp, { loading: companyVerifying }] = useMutation(VERIFY_COMPANY_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setIsCompanyVerified(true);
            setInfoMessage(data?.verifyCompanyOtp?.message || "Company verified.");
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    const [verifyUserOtp, { loading: userVerifying }] = useMutation(VERIFY_USER_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setIsUserVerified(true);
            setInfoMessage(data?.verifyUserOtp?.message || "Recruiter verified.");
            if (isCompanyVerified) {
                sessionStorage.removeItem("otp_company_email");
                sessionStorage.removeItem("otp_recruiter_email");
                setTimeout(() => navigate("/company/login"), 800);
            }
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    const [resendCompanyOtp, { loading: companyResending }] = useMutation(RESEND_COMPANY_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setInfoMessage(data?.resendCompanyOtp?.message || "Company OTP resent.");
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    const [resendUserOtp, { loading: userResending }] = useMutation(RESEND_USER_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setInfoMessage(data?.resendUserOtp?.message || "Recruiter OTP resent.");
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    function handleVerifyCompanyOtp() {
        setServerError("");
        if (!initialValues.companyEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        verifyCompanyOtp({
            variables: {
                email: initialValues.companyEmail,
                otp: companyOtp,
            },
        });
    }

    function handleVerifyUserOtp() {
        setServerError("");
        if (!initialValues.recruiterEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        verifyUserOtp({
            variables: {
                email: initialValues.recruiterEmail,
                otp: userOtp,
            },
        });
    }

    function handleResendCompanyOtp() {
        setServerError("");
        if (!initialValues.companyEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        resendCompanyOtp({ variables: { email: initialValues.companyEmail } });
    }

    function handleResendUserOtp() {
        setServerError("");
        if (!initialValues.recruiterEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        resendUserOtp({ variables: { email: initialValues.recruiterEmail } });
    }

    const allVerified = isCompanyVerified && isUserVerified;

    return (
        <AuthLayout
            title="Verify company and recruiter"
            subtitle="OTP is valid for 10 minutes"
            role="company"
            switchLabel="Back to login"
            switchLinkTo="/company/login"
            switchLinkLabel="Sign in"
        >
            <div className="space-y-4">
                <div className="space-y-2 rounded-lg border border-teal-100 bg-teal-50 p-4">
                    <p className="text-sm font-medium text-teal-900">Company OTP verification</p>
                    <Input
                        value={companyOtp}
                        onChange={(e) => setCompanyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit company OTP"
                        maxLength={6}
                    />
                    <div className="flex gap-2">
                        <Button type="button" className="flex-1" onClick={handleVerifyCompanyOtp} disabled={companyVerifying || companyOtp.length !== 6 || !initialValues.companyEmail || isCompanyVerified}>
                            {isCompanyVerified ? "Verified" : companyVerifying ? "Verifying..." : "Verify Company OTP"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleResendCompanyOtp} disabled={companyResending || !initialValues.companyEmail}>
                            {companyResending ? "Resending..." : "Resend"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-900">Recruiter OTP verification</p>
                    <Input
                        value={userOtp}
                        onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit recruiter OTP"
                        maxLength={6}
                    />
                    <div className="flex gap-2">
                        <Button type="button" className="flex-1" onClick={handleVerifyUserOtp} disabled={userVerifying || userOtp.length !== 6 || !initialValues.recruiterEmail || isUserVerified}>
                            {isUserVerified ? "Verified" : userVerifying ? "Verifying..." : "Verify Recruiter OTP"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleResendUserOtp} disabled={userResending || !initialValues.recruiterEmail}>
                            {userResending ? "Resending..." : "Resend"}
                        </Button>
                    </div>
                </div>

                {serverError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                {infoMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {infoMessage}
                    </div>
                )}

                {allVerified && (
                    <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                            sessionStorage.removeItem("otp_company_email");
                            sessionStorage.removeItem("otp_recruiter_email");
                            navigate("/company/login");
                        }}
                    >
                        Continue to login
                    </Button>
                )}
            </div>
        </AuthLayout>
    );
}
