import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { LogIn, Eye, EyeOff, User, Lock } from "lucide-react";

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
import { useAuth } from "@/contexts/AuthContext";
import { GOOGLE_APPLICANT_AUTH, LOGIN_APPLICANT } from "@/graphql/auth";
import { requestGoogleIdToken } from "@/lib/googleAuth";

const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function ApplicantLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { username: "", password: "" },
    });

    const [loginMutation, { loading }] = useMutation(LOGIN_APPLICANT, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            const { token, user } = data.applicantLogin;
            login(token, user);
            navigate("/applicant/dashboard");
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

    function onSubmit(values: FormData) {
        setServerError("");
        loginMutation({ variables: values });
    }

    async function onGoogleSignIn() {
        setServerError("");
        try {
            const idToken = await requestGoogleIdToken();
            googleAuthMutation({ variables: { idToken } });
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Google sign-in failed");
        }
    }

    return (
        <AuthLayout
            title="Welcome back 👋"
            subtitle="Sign in to your applicant account"
            role="applicant"
            switchLabel="Don't have an account?"
            switchLinkTo="/applicant/register"
            switchLinkLabel="Create one free"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading || googleLoading}
                        onClick={onGoogleSignIn}
                        className="w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700"
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
                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-400">Or continue with username</span>
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
                                        <Input
                                            placeholder="your_username"
                                            autoComplete="username"
                                            className="pl-9"
                                            {...field}
                                        />
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
                                            placeholder="••••••••"
                                            autoComplete="current-password"
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

                    {/* Forgot password */}
                    <div className="flex justify-end">
                        <Link
                            to="/applicant/forgot-password"
                            className="text-xs text-violet-600 hover:underline font-medium"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Server error */}
                    {serverError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 space-y-2">
                            <p>{serverError}</p>
                            {serverError.toLowerCase().includes("not verified") && (
                                <Link
                                    to="/applicant/verify-otp"
                                    className="inline-block text-violet-700 underline font-medium"
                                >
                                    Go to OTP verification
                                </Link>
                            )}
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
                                Signing in…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <LogIn className="w-4 h-4" />
                                Sign in
                            </span>
                        )}
                    </Button>
                </form>
            </Form>
        </AuthLayout>
    );
}
