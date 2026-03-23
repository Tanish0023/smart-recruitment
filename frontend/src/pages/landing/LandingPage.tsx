import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Building2, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ROLES = [
    {
        key: "applicant",
        label: "Job Applicant",
        description: "Browse jobs, submit applications, and track your hiring journey with AI-powered tools.",
        features: ["Smart job matching", "Easy application tracking", "Interview prep"],
        cta: "Get started",
        subtext: "Free to join",
        path: "/applicant/login",
        Icon: Briefcase,
        gradient: "from-violet-600 to-indigo-600",
        border: "hover:border-violet-400",
        glow: "hover:shadow-violet-100",
        ctaColor: "text-violet-600",
        checkColor: "text-violet-500",
        badgeGradient: "from-violet-500/10 to-indigo-500/10",
    },
    {
        key: "company",
        label: "Company / Recruiter",
        description: "Post jobs, screen candidates with AI, and build your dream team efficiently.",
        features: ["AI resume screening", "Candidate ranking", "Team collaboration"],
        cta: "Start hiring",
        subtext: "Free for 30 days",
        path: "/company/login",
        Icon: Building2,
        gradient: "from-emerald-600 to-teal-600",
        border: "hover:border-emerald-400",
        glow: "hover:shadow-emerald-100",
        ctaColor: "text-emerald-600",
        checkColor: "text-emerald-500",
        badgeGradient: "from-emerald-500/10 to-teal-500/10",
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-1/4 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,58,255,0.05)_0%,transparent_70%)] pointer-events-none" />

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mb-14 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">SmartRecruit</h1>
                    <p className="text-xs text-gray-500">AI-Powered Recruitment</p>
                </div>
            </Link>

            {/* Heading */}
            <div className="text-center mb-12 relative z-10">
                <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                    Who are you{" "}
                    <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                        today?
                    </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                    Choose your role to get started with the hiring journey.
                </p>
            </div>

            {/* Role Cards */}
            <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
                {ROLES.map((role) => {
                    const Icon = role.Icon;
                    return (
                        <Card
                            key={role.key}
                            onClick={() => navigate(role.path)}
                            className={`group bg-white/5 border border-white/10 ${role.border} rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${role.glow} overflow-hidden`}
                        >
                            <CardContent className="p-8">
                                {/* Icon */}
                                <div
                                    className={`w-14 h-14 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{role.label}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-5">{role.description}</p>

                                <ul className="space-y-2 mb-6">
                                    {role.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${role.checkColor}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between">
                                    <span className={`${role.ctaColor} text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200`}>
                                        {role.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                    <span className="text-xs text-gray-500">{role.subtext}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <p className="mt-12 text-gray-600 text-xs relative z-10 text-center">
                By continuing, you agree to our{" "}
                <Button variant="link" className="text-gray-500 text-xs p-0 h-auto hover:text-white">
                    Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="text-gray-500 text-xs p-0 h-auto hover:text-white">
                    Privacy Policy
                </Button>
            </p>
        </div>
    );
}
