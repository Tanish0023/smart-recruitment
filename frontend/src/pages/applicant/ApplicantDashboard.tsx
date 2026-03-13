import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
    Briefcase, Search, MapPin, CheckCircle2, Clock, XCircle,
    Star, UserCheck, Loader2, ArrowRight, Send, Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobCard } from "@/components/JobCard";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GET_ALL_JOBS, GET_MY_APPLICATIONS, APPLY_TO_JOB } from "@/graphql/jobs";
import { Link } from "react-router-dom";


const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    applied: { label: "Applied", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3.5 h-3.5" /> },
    reviewing: { label: "Reviewing", color: "bg-amber-100 text-amber-700", icon: <Star className="w-3.5 h-3.5" /> },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700", icon: <UserCheck className="w-3.5 h-3.5" /> },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
    hired: { label: "Hired! 🎉", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

interface Job {
    id: string; title: string; description: string; location?: string | null;
    salaryRange?: string | null; createdAt: string; company: { id: string; name: string };
}
interface Application {
    id: string; status: string; appliedAt: string;
    job: { id: string; title: string; location?: string | null; salaryRange?: string | null; company: { id: string; name: string } };
}

type Tab = "applications";

function useTab(): [Tab, (t: Tab) => void] {
    const initial: Tab =  "applications";
    const [tab, setTab] = useState<Tab>(initial);
    return [tab, setTab];
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ApplicantDashboard() {
    const [activeTab, setActiveTab] = useTab();
    const [applyOpen, setApplyOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [applyError, setApplyError] = useState("");
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

    const { data: appsData, loading: appsLoading, refetch: refetchApps } = useQuery<{ myApplications: Application[] }>(GET_MY_APPLICATIONS);

    const [applyMutation, { loading: applying }] = useMutation(APPLY_TO_JOB, {
        onCompleted() {
            if (selectedJob) setAppliedIds((prev) => new Set([...prev, selectedJob.id]));
            setApplyOpen(false);
            setResumeFile(null);
            setSelectedJob(null);
            refetchApps();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError(err: any) { setApplyError(err.message); },
    });

    const applications = appsData?.myApplications ?? [];
    // const appliedJobIds = new Set([
    //     ...applications.map((a) => a.job.id),
    //     ...appliedIds,
    // ])

    function openApply(job: Job) {
        setSelectedJob(job); setApplyError(""); setResumeFile(null); setApplyOpen(true);
    }
    function submitApply() {
        if (!resumeFile) { setApplyError("Please upload your resume."); return; }
        applyMutation({ variables: { jobId: Number(selectedJob?.id), resume: resumeFile } });
    }

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-full">
            <DashboardLayout
                hideHeader
                sidebarContent={
                    <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                        <TabsTrigger
                            value="applications"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 hover:bg-gray-100 transition-all border-none shadow-none w-full"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>My Applications</span>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <div className="p-6 max-w-7xl mx-auto">
                    {/* ── MY APPLICATIONS TAB ── */}
                    <TabsContent value="applications" className="mt-0 outline-none">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>

                                <Link to="/jobs" className="text-indigo-700 text-sm hover:bg-indigo-100 ring-1 ring-indigo-700 rounded-lg px-2 py-1 cursor-pointer">Browse Jobs</Link>
                            </div>

                            {appsLoading && (
                                <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin" /> Loading applications…
                                </div>
                            )}
                            {!appsLoading && applications.length === 0 && (
                                <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                                    <CheckCircle2 className="w-10 h-10 text-gray-300" />
                                    <p className="font-medium text-gray-500">No applications yet</p>
                                    <Link to="/jobs" className="text-sm text-indigo-600 hover:underline transition-all">
                                        Browse available jobs →
                                    </Link>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                                {applications.map((app) => {
                                    const s = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                                    const date = new Date(app.appliedAt).toLocaleDateString("en-IN", {
                                        day: "numeric", month: "short", year: "numeric",
                                    });
                                    return (
                                        <div key={app.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-all group">
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/jobs/${app.job.id}`} className="font-bold text-gray-900 hover:text-indigo-700 transition-colors text-lg">
                                                    {app.job.title}
                                                </Link>
                                                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                                                    <span className="font-medium text-gray-700">{app.job.company.name}</span>
                                                    {app.job.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />{app.job.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 h-full">
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${s.color}`}>
                                                    {s.icon} {s.label}
                                                </span>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">Applied on</span>
                                                    <span className="text-sm font-medium text-gray-600">{date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>
                </div>

                {/* Apply Dialog */}
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Apply to {selectedJob?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Upload Resume <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 transition-colors cursor-pointer relative group">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{resumeFile ? resumeFile.name : "Click to upload PDF/DOC"}</p>
                                    <p className="text-xs text-gray-400">Max file size 5MB</p>
                                </div>
                            </div>
                            {applyError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{applyError}</p>
                            )}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setApplyOpen(false)} className="rounded-xl h-11">Cancel</Button>
                            <Button
                                onClick={submitApply}
                                disabled={applying || !resumeFile}
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl h-11 px-8 font-semibold shadow-lg shadow-indigo-100"
                            >
                                {applying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                                Submit Application
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </Tabs>
    );
}
