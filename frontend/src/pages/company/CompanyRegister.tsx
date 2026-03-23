import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { Building2, Eye, EyeOff, User, Mail, Lock, Globe, UserPlus } from "lucide-react";

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
import { CREATE_COMPANY, REGISTER_USER } from "@/graphql/auth";

const schema = z
    .object({
        companyName: z.string().min(2, "Company name must be at least 2 characters"),
        website: z
            .string()
            .optional()
            .refine((v) => !v || v.startsWith("http"), {
                message: "Website must start with http:// or https://",
            }),
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
        email: z.string().email("Enter a valid email address"),
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

export default function CompanyRegister() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState("");

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            companyName: "",
            website: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const [registerUser, { loading: registering }] = useMutation(REGISTER_USER, {
        onCompleted() {
            navigate("/company/login");
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    const [createCompany, { loading: creating }] = useMutation(CREATE_COMPANY, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            const companyId = data.createCompany.company.id;
            const values = form.getValues();
            registerUser({
                variables: {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    isRecruiter: true,
                    companyId: parseInt(companyId),
                },
            });
        },
        onError(err) {
            setServerError(err.message);
        },
    });

    function onSubmit(values: FormData) {
        setServerError("");
        createCompany({
            variables: {
                name: values.companyName,
                website: values.website || null,
            },
        });
    }

    const loading = creating || registering;

    return (
        <AuthLayout
            title="Register your company"
            subtitle="Set up your recruiter account in seconds"
            role="company"
            switchLabel="Already registered?"
            switchLinkTo="/company/login"
            switchLinkLabel="Sign in"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Section label */}
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Company Details</p>

                    {/* Company Name */}
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input placeholder="Acme Corp" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Website */}
                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Website{" "}
                                    <span className="text-gray-400 font-normal">(optional)</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input placeholder="https://acme.com" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Divider */}
                    <div className="pt-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recruiter Account</p>
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
                                        <Input placeholder="recruiter_handle" autoComplete="username" className="pl-9" {...field} />
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
                                <FormLabel>Work Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input type="email" placeholder="recruiter@acme.com" autoComplete="email" className="pl-9" {...field} />
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
                        disabled={loading}
                        className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                {creating ? "Creating company…" : "Creating account…"}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Create company & account
                            </span>
                        )}
                    </Button>
                </form>
            </Form>
        </AuthLayout>
    );
}
