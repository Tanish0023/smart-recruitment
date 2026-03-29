import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { UserPlus, Eye, EyeOff, User, Mail, Lock } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { GOOGLE_APPLICANT_AUTH, REGISTER_USER } from "@/graphql/auth";
import { useAuth } from "@/contexts/AuthContext";
import { requestGoogleIdToken } from "@/lib/googleAuth";

const schema = z
    .object({
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(30, "Username too long")
            .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores"),
        email: z.email("Enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type FormData = z.infer<typeof schema>;

export default function ApplicantRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState("");

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
    });

    const [registerMutation, { loading }] = useMutation(REGISTER_USER, {
        onCompleted() {
            const email = form.getValues("email");
            sessionStorage.setItem("otp_applicant_email", email);
            navigate("/applicant/verify-otp", { state: { email } });
        },
        onError(err: Error) {
            setServerError(err.message);
        },
    });

    const [googleAuthMutation, { loading: googleLoading }] = useMutation(GOOGLE_APPLICANT_AUTH, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            const { token, user } = data.googleApplicantAuth;
            login(token, user);
            navigate("/applicant/dashboard");
        },
        onError(err: Error) {
            setServerError(err.message);
        },
    });

    function onSubmit({ username, email, password }: FormData) {
        setServerError("");
        registerMutation({
            variables: { username, email, password, isRecruiter: false },
        });
    }

    async function onGoogleSignUp() {
        setServerError("");
        try {
            const idToken = await requestGoogleIdToken();
            googleAuthMutation({ variables: { idToken } });
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Google signup failed");
        }
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Join thousands of applicants finding great jobs"
            role="applicant"
            switchLabel="Already have an account?"
            switchLinkTo="/applicant/login"
            switchLinkLabel="Sign in"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading || googleLoading}
                        onClick={onGoogleSignUp}
                        className="w-full border-gray-300 hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.4l2.7-2.6C16.9 2.9 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.9H12z" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-400">Or register with email</span>
                        </div>
                    </div>

                    {/* Username */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input placeholder="your_username" autoComplete="username" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input type="email" placeholder="you@example.com" autoComplete="email" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                                            autoComplete="new-password"
                                            className="pl-9 pr-9"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            autoComplete="new-password"
                                            className="pl-9 pr-9"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {serverError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Creating account…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Create account
                            </span>
                        )}
                    </Button>

                    <p className="text-xs text-gray-400 text-center">
                        By registering you agree to our{" "}
                        <span className="text-violet-600 hover:underline cursor-pointer">Terms of Service</span>
                    </p>
                </form>
            </Form>
        </AuthLayout>
    );
}
