import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RESEND_USER_OTP, VERIFY_USER_OTP } from "@/graphql/auth";

export default function ApplicantVerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialEmail = useMemo(() => {
        const stateEmail = ((location.state as { email?: string } | null)?.email || "").trim();
        const storedEmail = (sessionStorage.getItem("otp_applicant_email") || "").trim();
        return stateEmail || storedEmail;
    }, [location.state]);

    const [otp, setOtp] = useState("");
    const [serverError, setServerError] = useState("");
    const [infoMessage, setInfoMessage] = useState("Enter the OTP sent to your email. It is valid for 10 minutes.");

    const [verifyOtp, { loading: verifying }] = useMutation(VERIFY_USER_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setInfoMessage(data?.verifyUserOtp?.message || "Account verified successfully.");
            sessionStorage.removeItem("otp_applicant_email");
            setTimeout(() => navigate("/applicant/login"), 800);
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    const [resendOtp, { loading: resending }] = useMutation(RESEND_USER_OTP, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            setInfoMessage(data?.resendUserOtp?.message || "OTP resent and valid for 10 minutes.");
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    function handleVerify() {
        setServerError("");
        if (!initialEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        verifyOtp({
            variables: {
                email: initialEmail,
                otp,
            },
        });
    }

    function handleResend() {
        setServerError("");
        if (!initialEmail) {
            setServerError("Verification session expired. Please register again.");
            return;
        }
        resendOtp({
            variables: {
                email: initialEmail,
            },
        });
    }

    return (
        <AuthLayout
            title="Verify your account"
            subtitle="Enter OTP to activate your applicant profile"
            role="applicant"
            switchLabel="Back to login"
            switchLinkTo="/applicant/login"
            switchLinkLabel="Sign in"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">OTP</label>
                    <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                    />
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

                <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={handleVerify} disabled={verifying || otp.length !== 6 || !initialEmail}>
                        {verifying ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResend} disabled={resending || !initialEmail}>
                        {resending ? "Resending..." : "Resend OTP"}
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
