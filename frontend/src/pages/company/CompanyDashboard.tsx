import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
    Briefcase, Plus, Pencil, Trash2, Users, ToggleLeft, ToggleRight,
    Loader2, CheckCircle2, CircleOff,
    MapPin, DollarSign,
} from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    GET_COMPANY_JOBS, GET_JOB_APPLICANTS,
    CREATE_JOB, UPDATE_JOB, DELETE_JOB, UPDATE_APPLICATION_STATUS,
} from "@/graphql/jobs";

/* ─── Types ──────────────────────────────────────────── */
interface Job {
    id: string; title: string; description: string;
    location?: string | null; salaryRange?: string | null;
    isActive: boolean; createdAt: string;
}
interface Applicant {
    id: string; status: string; appliedAt: string; resumeUrl: string;
    applicant: { id: string; username: string; email: string };
}

interface CreateJobData {
    createJob: {
        job: Job;
    };
}

interface UpdateJobData {
    updateJob: {
        job: Job;
    };
}

interface DeleteJobData {
    deleteJob: {
        success: boolean;
    };
}

interface UpdateApplicationStatusData {
    updateApplicationStatus: {
        application: {
            id: string;
            status: string;
        }
    }
}

type Tab = "jobs" | "post" | "applicants";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    applied: { label: "Applied", color: "bg-blue-100 text-blue-700" },
    reviewing: { label: "Reviewing", color: "bg-amber-100 text-amber-700" },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
    hired: { label: "Hired! 🎉", color: "bg-emerald-100 text-emerald-700" },
};

const STATUS_OPTIONS = ["applied", "reviewing", "shortlisted", "rejected", "hired"];

const NAV_ITEMS = []; // Removed in favor of Tabs-driven sidebar

/* ─── Schema ────────────────────────────────────────── */
const jobSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    location: z.string().optional(),
    salaryRange: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

/* ─── Validation Adapter ────────────────────────────── */
const validateWithZod = (schema: z.ZodSchema) => (values: any) => {
    try {
        schema.parse(values);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return err.flatten().fieldErrors;
        }
    }
};

/* ─── JobForm ────────────────────────────────────────── */
interface JobFormProps {
    initial?: Partial<JobFormValues>;
    onSubmit: (v: JobFormValues) => void;
    loading: boolean;
    submitLabel?: string;
}

function JobForm({ initial, onSubmit, loading, submitLabel = "Save" }: JobFormProps) {
    const initialValues: JobFormValues = {
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        location: initial?.location ?? "",
        salaryRange: initial?.salaryRange ?? "",
    };

    return (
        <Formik
            initialValues={initialValues}
            validate={validateWithZod(jobSchema)}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ isValid, dirty }) => (
                <Form className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <Field name="title">
                            {({ field }: any) => (
                                <Input {...field} placeholder="e.g. Senior Frontend Engineer" />
                            )}
                        </Field>
                        <ErrorMessage name="title" component="p" className="text-xs text-red-500 mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                            <Field name="location">
                                {({ field }: any) => (
                                    <Input {...field} placeholder="e.g. Bangalore / Remote" />
                                )}
                            </Field>
                            <ErrorMessage name="location" component="p" className="text-xs text-red-500 mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Salary Range</label>
                            <Field name="salaryRange">
                                {({ field }: any) => (
                                    <Input {...field} placeholder="e.g. ₹8L – ₹14L" />
                                )}
                            </Field>
                            <ErrorMessage name="salaryRange" component="p" className="text-xs text-red-500 mt-1" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <Field name="description">
                            {({ field }: any) => (
                                <textarea
                                    {...field}
                                    rows={6}
                                    placeholder="Describe the role, responsibilities, and requirements…"
                                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            )}
                        </Field>
                        <ErrorMessage name="description" component="p" className="text-xs text-red-500 mt-1" />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading || !isValid || !dirty}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            {submitLabel}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}

/* ─── Main Component ─────────────────────────────────── */
export default function CompanyDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("jobs");
    const [editJob, setEditJob] = useState<Job | null>(null);
    const [deleteJob, setDeleteJobState] = useState<Job | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState("");

    /* ── Queries ── */
    const { data: jobsData, loading: jobsLoading, refetch: refetchJobs } =
        useQuery<{ companyJobs: Job[] }>(GET_COMPANY_JOBS);
    const { data: applicantsData, loading: applicantsLoading, refetch: refetchApplicants } =
        useQuery<{ jobApplicants: Applicant[] }>(GET_JOB_APPLICANTS, {
            variables: { jobId: Number(selectedJobId) },
            skip: !selectedJobId,
        });

    useEffect(() => {
        if (jobsData?.companyJobs?.length && !selectedJobId) {
            setSelectedJobId(jobsData.companyJobs[0].id);
        }
    }, [jobsData, selectedJobId]);

    /* ── Mutations ── */
    function flash(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); }

    const [createJob, { loading: creating }] = useMutation<CreateJobData>(CREATE_JOB, {
        onCompleted() { refetchJobs(); flash("Job posted successfully!"); setActiveTab("jobs"); },
        onError(error) { flash("Error: " + error.message); },
    });
    const [updateJob, { loading: updating }] = useMutation<UpdateJobData>(UPDATE_JOB, {
        onCompleted() { refetchJobs(); setEditJob(null); flash("Job updated!"); },
    });
    const [deleteJobMut, { loading: deleting }] = useMutation<DeleteJobData>(DELETE_JOB, {
        onCompleted() { refetchJobs(); setDeleteJobState(null); flash("Job deleted."); },
    });
    const [updateStatus] = useMutation<UpdateApplicationStatusData>(UPDATE_APPLICATION_STATUS, {
        update(cache, { data }) {
            const updated = data?.updateApplicationStatus?.application;

            if (!updated) return;

            cache.modify({
                fields: {
                    jobApplicants(existing = []) {
                        return existing.map((app: any) =>
                            app.id === updated.id
                                ? { ...app, status: updated.status }
                                : app
                        );
                    },
                },
            });
        },
    });

    const jobs = jobsData?.companyJobs ?? [];
    const applicants = applicantsData?.jobApplicants ?? [];

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-full">
            <DashboardLayout
                hideHeader
                sidebarContent={
                    <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                        <TabsTrigger
                            value="jobs"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 hover:bg-gray-100 transition-all border-none shadow-none w-full"
                        >
                            <Briefcase className="w-4 h-4" />
                            <span>My Jobs</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="applicants"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 hover:bg-gray-100 transition-all border-none shadow-none w-full"
                        >
                            <Users className="w-4 h-4" />
                            <span>Applicants</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="post"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 hover:bg-gray-100 transition-all border-none shadow-none w-full ring-indigo-700 ring-1 text-indigo-700"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Post a Job</span>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                {/* Success toast */}
                {successMsg && (
                    <div className="mx-6 mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" /> {successMsg}
                    </div>
                )}

                <div className="p-6 max-w-6xl mx-auto">
                    <TabsContent value="jobs" className="mt-0">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                                <Button
                                    onClick={() => setActiveTab("post")}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Post New Job
                                </Button>
                            </div>

                            {/* ... existing jobs code ... */}
                            {jobsLoading && (
                                <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin" /> Loading jobs…
                                </div>
                            )}

                            {!jobsLoading && jobs.length === 0 && (
                                <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                                    <Briefcase className="w-10 h-10 text-gray-300" />
                                    <p className="font-medium text-gray-500">No jobs yet</p>
                                    <Button onClick={() => setActiveTab("post")} variant="outline" size="sm">Post your first job</Button>
                                </div>
                            )}

                            {jobs.map((job) => (
                                <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 text-lg truncate">{job.title}</h3>
                                                <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${job.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                                    }`}>
                                                    {job.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                                                    </span>
                                                )}
                                                {job.salaryRange && (
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}
                                                    </span>
                                                )}
                                                <span className="text-gray-400 text-xs">
                                                    Posted {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.description}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                title={job.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => updateJob({ variables: { jobId: Number(job.id), isActive: !job.isActive } })}
                                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                                            >
                                                {job.isActive
                                                    ? <ToggleRight className="w-5 h-5 text-emerald-600" />
                                                    : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                            </button>
                                            <button
                                                title="View applicants"
                                                onClick={() => { setSelectedJobId(job.id); setActiveTab("applicants"); }}
                                                className="p-2 rounded-xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            >
                                                <Users className="w-5 h-5" />
                                            </button>
                                            <button
                                                title="Edit"
                                                onClick={() => setEditJob(job)}
                                                className="p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={() => setDeleteJobState(job)}
                                                className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="post" className="mt-0">
                        <div className="max-w-2xl">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <JobForm
                                    loading={creating}
                                    submitLabel="Post Job"
                                    onSubmit={(v) =>
                                        createJob({
                                            variables: {
                                                title: v.title,
                                                description: v.description,
                                                location: v.location || null,
                                                salaryRange: v.salaryRange || null,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="applicants" className="mt-0">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Applicants</h1>
                            {/* Job selector */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Select a Job to View Applicants</label>
                                <div className="flex flex-wrap gap-2">
                                    {jobs.map((job) => (
                                        <button
                                            key={job.id}
                                            onClick={() => setSelectedJobId(job.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedJobId === job.id
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                                                }`}
                                        >
                                            {job.title}
                                        </button>
                                    ))}
                                    {jobs.length === 0 && (
                                        <p className="text-sm text-gray-500">No jobs found.</p>
                                    )}
                                </div>
                            </div>

                            {selectedJobId && (
                                <div className="mt-8 space-y-4">
                                    {applicantsLoading && (
                                        <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Loading applicants…
                                        </div>
                                    )}
                                    {!applicantsLoading && applicants.length === 0 && (
                                        <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                                            <CircleOff className="w-8 h-8 text-gray-300" />
                                            <p className="font-medium text-gray-500">No applicants yet for this job</p>
                                        </div>
                                    )}
                                    {applicants.map((app) => {
                                        const s = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                                        return (
                                            <div key={app.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900">{app.applicant.username}</p>
                                                    <p className="text-sm text-gray-500">{app.applicant.email}</p>
                                                    {app.resumeUrl && (
                                                        <a
                                                            href={app.resumeUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                                                        >
                                                            View Resume →
                                                        </a>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${s.color}`}>
                                                        {s.label}
                                                    </span>
                                                    <select
                                                        value={app.status}
                                                        onChange={(e) =>
                                                            updateStatus({ variables: { applicationId: Number(app.id), status: e.target.value } })
                                                        }
                                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    >
                                                        {STATUS_OPTIONS.map((s) => (
                                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>

                {/* ──────────── Edit Job Dialog ──────────── */}
                <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Edit Job</DialogTitle>
                        </DialogHeader>
                        {editJob && (
                            <JobForm
                                initial={{
                                    title: editJob.title,
                                    description: editJob.description,
                                    location: editJob.location ?? undefined,
                                    salaryRange: editJob.salaryRange ?? undefined,
                                }}
                                loading={updating}
                                submitLabel="Save Changes"
                                onSubmit={(v) =>
                                    updateJob({
                                        variables: {
                                            jobId: Number(editJob.id),
                                            title: v.title,
                                            description: v.description,
                                            location: v.location || null,
                                            salaryRange: v.salaryRange || null,
                                        },
                                    })
                                }
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* ──────────── Delete Confirm Dialog ──────────── */}
                <Dialog open={!!deleteJob} onOpenChange={(o) => !o && setDeleteJobState(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Delete Job</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>"{deleteJob?.title}"</strong>? This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteJobState(null)}>Cancel</Button>
                            <Button
                                onClick={() => deleteJobMut({ variables: { jobId: Number(deleteJob?.id) } })}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </Tabs>
    );
}
