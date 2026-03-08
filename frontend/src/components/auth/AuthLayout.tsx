import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building2, Target, CheckCircle2 } from "lucide-react";

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
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div
                className={`hidden lg:flex lg:w-[45%] bg-gradient-to-br ${cfg.gradient} flex-col justify-between p-12 relative overflow-hidden`}
            >
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">SmartRecruit</span>
                </div>

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

                <p className="relative z-10 text-white/50 text-sm">© 2026 SmartRecruit. All rights reserved.</p>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className={`w-8 h-8 bg-gradient-to-br ${cfg.gradient} rounded-lg flex items-center justify-center`}>
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">SmartRecruit</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{title}</h1>
                        <p className="text-gray-500">{subtitle}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {children}
                    </div>

                    <p className="text-center mt-6 text-sm text-gray-500">
                        {switchLabel}{" "}
                        <Link
                            to={switchLinkTo}
                            className={`font-semibold ${cfg.panelText} hover:underline`}
                        >
                            {switchLinkLabel}
                        </Link>
                    </p>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            ← Back to role selection
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
