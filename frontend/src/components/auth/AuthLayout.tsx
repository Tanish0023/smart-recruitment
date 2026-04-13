import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building2, Target, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    role: "applicant" | "company";
    switchLabel: string;
    switchLinkTo: string;
    switchLinkLabel: string;
}

const ROLE_CONFIG = {
    applicant: {
        gradient: "from-violet-600 via-purple-600 to-indigo-700",
        panelText: "text-violet-600",
        tagline: "Find your dream job with AI-powered matching",
        features: ["Smart resume matching", "Instant job alerts", "Interview prep tools"],
        Icon: Briefcase,
    },
    company: {
        gradient: "from-emerald-600 via-teal-600 to-cyan-700",
        panelText: "text-emerald-600",
        tagline: "Hire the best talent with intelligent screening",
        features: ["AI resume screening", "Candidate ranking", "Team collaboration"],
        Icon: Building2,
    },
};

export function AuthLayout({
    children,
    title,
    subtitle,
    role,
    switchLabel,
    switchLinkTo,
    switchLinkLabel,
}: AuthLayoutProps) {
    const cfg = ROLE_CONFIG[role];
    const RoleIcon = cfg.Icon;

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Left panel — branding */}
            <div
                className={`hidden lg:flex lg:w-[45%] bg-linear-to-br ${cfg.gradient} flex-col justify-between p-12 relative overflow-hidden`}
            >
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

                {/* Logo */}
                <Link to="/" className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">SmartRecruit</span>
                </Link>

                {/* Center copy */}
                <div className="relative z-10 space-y-8">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <RoleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">
                            {cfg.tagline}
                        </h2>
                        <p className="text-white/70 text-lg">Powered by AI — built for modern teams.</p>
                    </div>
                    <ul className="space-y-3">
                        {cfg.features.map((f) => (
                            <li key={f} className="flex items-center gap-3 text-white/90">
                                <CheckCircle2 className="w-5 h-5 text-white/60 shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-white/50 text-sm">© {new Date().getFullYear()} SmartRecruit. All rights reserved.</p>
            </div>

            {/* Right panel — form */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-slate-950 transition-colors">
                <div className="absolute top-4 right-4 z-20 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-1 shadow-sm backdrop-blur-sm">
                    <ThemeToggle />
                </div>
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className={`w-8 h-8 bg-linear-to-br ${cfg.gradient} rounded-lg flex items-center justify-center`}>
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-slate-100 text-lg">SmartRecruit</span>
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mb-1">{title}</h1>
                        <p className="text-gray-500 dark:text-slate-300">{subtitle}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-gray-900 dark:text-slate-100 transition-colors">
                        {children}
                    </div>

                    <p className="text-center mt-6 text-sm text-gray-500 dark:text-slate-300">
                        {switchLabel}{" "}
                        <Link
                            to={switchLinkTo}
                            className={`font-semibold ${cfg.panelText} hover:underline`}
                        >
                            {switchLinkLabel}
                        </Link>
                    </p>

                    <div className="mt-6 text-center">
                        <Link to="/auth" className="text-xs text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                            ← Back to role selection
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
