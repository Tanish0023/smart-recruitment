import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import {
    MapPin, DollarSign, Building2, Calendar, ArrowLeft,
    Globe, CheckCircle2, Loader2, Rocket, Send,
} from "lucide-react";
import { GET_JOB_DETAIL, APPLY_TO_JOB, GET_MY_APPLICATIONS } from "@/graphql/jobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface JobDetail {
    id: string;
    title: string;
    description: string;
    location?: string | null;
    salaryRange?: string | null;
    minimumExperienceRequired?: number | null;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    company: { id: string; name: string; website?: string | null };
}

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [applyError, setApplyError] = useState("");

    const { data, loading, error } = useQuery<{ jobDetail: JobDetail }>(GET_JOB_DETAIL, {
        variables: { jobId: Number(id) },
        skip: !id,
    });

    const { data: appsData } = useQuery<{ myApplications: { job: { id: string } }[] }>(GET_MY_APPLICATIONS, {
        skip: !isAuthenticated || user?.isRecruiter,
    });

    const hasApplied = Boolean(appsData?.myApplications.some((application) => application.job.id === id));
    const applied = hasApplied;

    const [applyMutation, { loading: applying }] = useMutation(APPLY_TO_JOB, {
        refetchQueries: [{ query: GET_MY_APPLICATIONS }],
        awaitRefetchQueries: true,
        onError(err) {
            setApplyError(err.message);
        },
    });

    function handleApplyClick() {
        setApplyError("");
        if (!isAuthenticated) {
            navigate("/applicant/login");
            return;
        }
        if (user?.isRecruiter) {
            setApplyError("Recruiters cannot apply to jobs. Please use an applicant account.");
            return;
        }
        if (!id) {
            setApplyError("Invalid job id");
            return;
        }
        applyMutation({ variables: { jobId: Number(id) } });
    }

    const job = data?.jobDetail;
    const dateStr = job
        ? new Date(job.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
        })
        : "";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-2 rounded-xl">
                            <Rocket size={18} />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600">
                            Smart Recruit
                        </span>
                    </Link>
                    <Link to="/jobs" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> All Jobs
                    </Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {loading && (
                    <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Loading job…</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center">
                        <p className="font-semibold text-lg">Could not load job</p>
                        <p className="text-sm mt-1">{error.message}</p>
                        <button onClick={() => navigate("/jobs")} className="mt-4 text-sm text-indigo-600 hover:underline">
                            ← Back to jobs
                        </button>
                    </div>
                )}

                {job && (
                    <div className="space-y-6">
                        {/* Hero card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-semibold text-gray-800">{job.company.name}</span>
                                        {job.company.website && (
                                            <a
                                                href={job.company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Apply CTA */}
                                <div className="flex flex-col items-end gap-2">
                                    {applied ? (
                                        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Applied!
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleApplyClick}
                                            disabled={applying}
                                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-7 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                                        >
                                            {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                            {applying ? "Applying..." : "Apply Now"}
                                        </Button>
                                    )}
                                    {applyError && (
                                        <div className="max-w-xs text-right space-y-1">
                                            <p className="text-xs text-red-600">{applyError}</p>
                                            {applyError.includes("Complete your profile") && (
                                                <Link to="/applicant/dashboard" className="text-xs text-indigo-700 hover:underline">
                                                    Complete profile in dashboard
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta chips */}
                            <div className="flex flex-wrap gap-2 mt-5">
                                {job.location && (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                                    </span>
                                )}
                                {job.salaryRange && (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                                        <DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                                    <Calendar className="w-3.5 h-3.5" /> Posted {dateStr}
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                                    Min Experience {job.minimumExperienceRequired ?? 0}+ years
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
                            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                {job.description}
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white text-center">
                            <p className="text-lg font-semibold mb-1">Excited about this role?</p>
                            <p className="text-indigo-200 text-sm mb-5">
                                {isAuthenticated ? "Submit your application now." : "Sign in or create a free account to apply."}
                            </p>
                            {applied ? (
                                <div className="inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-xl text-white font-semibold">
                                    <CheckCircle2 className="w-5 h-5" /> Application Submitted!
                                </div>
                            ) : (
                                <Button
                                    onClick={handleApplyClick}
                                    disabled={applying}
                                    className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-3 rounded-xl font-semibold shadow-md"
                                >
                                    {applying ? "Applying..." : "Apply for this Job"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
