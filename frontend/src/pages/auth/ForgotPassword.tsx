import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  REQUEST_PASSWORD_RESET_OTP,
  RESET_PASSWORD_WITH_OTP,
} from "@/graphql/auth";

type Role = "applicant" | "company";

type Props = {
  role: Role;
};

export default function ForgotPassword({ role }: Props) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    "Enter your account email to receive a 6-digit reset OTP."
  );

  const loginPath = useMemo(
    () => (role === "company" ? "/company/login" : "/applicant/login"),
    [role]
  );

  const title = role === "company" ? "Recruiter password reset" : "Applicant password reset";
  const subtitle = role === "company"
    ? "Reset your recruiter account password using email OTP"
    : "Reset your applicant account password using email OTP";

  const [requestOtp, { loading: requesting }] = useMutation(REQUEST_PASSWORD_RESET_OTP, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCompleted(data: any) {
      setInfoMessage(
        data?.requestPasswordResetOtp?.message ||
          "If an account exists for this email, a reset OTP has been sent."
      );
    },
    onError(err) {
      setServerError(err.message);
    },
  });

  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD_WITH_OTP, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCompleted(data: any) {
      setInfoMessage(data?.resetPasswordWithOtp?.message || "Password reset successful");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError(err) {
      setServerError(err.message);
    },
  });

  function handleRequestOtp() {
    setServerError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setServerError("Email is required");
      return;
    }

    requestOtp({ variables: { email: normalizedEmail } });
  }

  function handleResetPassword() {
    setServerError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setServerError("Email is required");
      return;
    }

    if (otp.trim().length !== 6) {
      setServerError("Enter a valid 6-digit OTP");
      return;
    }

    if (newPassword.length < 8) {
      setServerError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setServerError("Passwords do not match");
      return;
    }

    resetPassword({
      variables: {
        email: normalizedEmail,
        otp: otp.trim(),
        newPassword,
      },
    });
  }

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      role={role}
      switchLabel="Remembered your password?"
      switchLinkTo={loginPath}
      switchLinkLabel="Back to sign in"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === "company" ? "recruiter@company.com" : "you@example.com"}
            autoComplete="email"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleRequestOtp}
          disabled={requesting}
          className="w-full"
        >
          {requesting ? "Sending OTP..." : "Send reset OTP"}
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">OTP</label>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">New Password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
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

        <Button
          type="button"
          onClick={handleResetPassword}
          disabled={resetting}
          className="w-full"
        >
          {resetting ? "Resetting password..." : "Reset password"}
        </Button>
      </div>
    </AuthLayout>
  );
}
