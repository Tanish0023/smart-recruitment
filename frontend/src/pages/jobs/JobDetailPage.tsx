import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, DollarSign, Building2, Calendar, ArrowLeft,
    Globe, CheckCircle2, Loader2, Rocket, Send, Plus,
} from "lucide-react";
import { GET_JOB_DETAIL, APPLY_TO_JOB, GET_MY_APPLICATIONS } from "@/graphql/jobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

    const [applyOpen, setApplyOpen] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [applyError, setApplyError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { data, loading, error } = useQuery<{ jobDetail: JobDetail }>(GET_JOB_DETAIL, {
        variables: { jobId: Number(id) },
        skip: !id,
    });

    const { data: appsData } = useQuery<{ myApplications: { job: { id: string } }[] }>(GET_MY_APPLICATIONS, {
        skip: !isAuthenticated || user?.isRecruiter,
    });

    const hasApplied = Boolean(appsData?.myApplications.some((application) => application.job.id === id));
    const applied = success || hasApplied;

    const [applyMutation, { loading: applying }] = useMutation(APPLY_TO_JOB, {
        onCompleted() {
            setSuccess(true);
        },
        onError(err) {
            setApplyError(err.message);
        },
    });

    function handleFileChange(file: File | null) {
        setApplyError("");
        if (!file) return;

        // Validation
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (!validTypes.includes(file.type)) {
            setApplyError("Please upload PDF only.");
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            setApplyError("File size must be less than 1MB.");
            return;
        }
        setResumeFile(file);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }
    function handleDragLeave() {
        setIsDragging(false);
    }
    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileChange(file);
    }

    function handleApplyClick() {
        if (!isAuthenticated) {
            navigate("/applicant/login");
            return;
        }
        if (user?.isRecruiter) {
            setApplyError("Recruiters cannot apply to jobs. Please use an applicant account.");
            return;
        }
        setApplyOpen(true);
    }

    function submitApplication() {
        setApplyError("");
        if (!resumeFile) { setApplyError("Please upload your resume."); return; }
        applyMutation({ variables: { jobId: Number(id), resume: resumeFile } });
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
                                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-7 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Apply Now
                                        </Button>
                                    )}
                                    {applyError && <p className="text-xs text-red-600 max-w-xs text-right">{applyError}</p>}
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
                                    className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-3 rounded-xl font-semibold shadow-md"
                                >
                                    Apply for this Job
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Apply Dialog */}
            <Dialog
                open={applyOpen}
                onOpenChange={(open) => {
                    setApplyOpen(open);
                    if (!open) {
                        setTimeout(() => {
                            setSuccess(false);
                            setResumeFile(null);
                            setApplyError("");
                        }, 300);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="py-8 flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Application Sent!</h3>
                                <p className="text-gray-500 mt-2 text-sm max-w-[240px]">
                                    Your resume has been successfully submitted to <strong>{job?.company.name}</strong>.
                                </p>
                                <Button
                                    onClick={() => setApplyOpen(false)}
                                    className="mt-8 bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8 h-11"
                                >
                                    Done
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold">Apply to {job?.title}</DialogTitle>
                                </DialogHeader>
                                <div className="py-2 space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Resume File (PDF/DOC) <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`
                                                relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group h-40
                                                ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}
                                            `}
                                        >
                                            <Input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {!resumeFile && (<div className={`
                                                w-12 h-12 rounded-xl flex items-center justify-center transition-transform pointer-events-none
                                                ${isDragging ? "bg-indigo-600 text-white scale-110" : "bg-indigo-50 text-indigo-600 group-hover:scale-110"}
                                            `}>
                                                <Plus className="w-6 h-6" />
                                            </div>)}
                                            <div className="text-center pointer-events-none">
                                                <p className="text-sm font-bold text-gray-700">
                                                    {resumeFile ? resumeFile.name : (isDragging ? "Drop to upload" : "Select or drag resume")}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">PDF only, max 1MB</p>
                                            </div>
                                        </div>
                                    </div>
                                    {applyError && (
                                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">
                                            {applyError}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setApplyOpen(false)} className="rounded-xl h-11 cursor-pointer">Cancel</Button>
                                    <Button
                                        onClick={submitApplication}
                                        disabled={applying || !resumeFile}
                                        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl h-11 px-8 font-semibold shadow-lg shadow-indigo-100"
                                    >
                                        {applying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                                        Submit
                                    </Button>
                                </DialogFooter>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </div>
    );
}
