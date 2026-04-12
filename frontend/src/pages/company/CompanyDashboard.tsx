import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
    Briefcase, Plus, Pencil, Trash2, Users, ToggleLeft, ToggleRight,
    Loader2, CircleOff,
    MapPin, DollarSign, Search,
    X, Sparkles,
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
import { ListItemSkeleton } from "@/components/AppSkeletons";
import {
    GET_COMPANY_JOBS, GET_JOB_APPLICANTS,
    GET_ALL_SKILLS, GET_ALL_CATEGORIES,
    CREATE_JOB, UPDATE_JOB, DELETE_JOB, UPDATE_APPLICATION_STATUS,
    GET_JOB_QUESTIONS, GENERATE_AI_JOB_QUESTIONS, DELETE_JOB_QUESTION, DELETE_ALL_JOB_QUESTIONS,
    GET_AI_JOB_DRAFT_RESULT, QUEUE_AI_JOB_DRAFT,
} from "@/graphql/jobs";

/* ─── Types ──────────────────────────────────────────── */
interface Job {
    id: string; title: string; description: string;
    location?: string | null; salaryRange?: string | null;
    minimumExperienceRequired: number;
    scoreWeightSkill?: number;
    scoreWeightCategory?: number;
    scoreWeightExperience?: number;
    scoreWeightSemantic?: number;
    skills: Skill[];
    categories: Category[];
    questionCount?: number;
    applicationCount?: number;
    isActive: boolean; createdAt: string;
}
interface Skill {
    id: string;
    name: string;
    category?: {
        id: string;
        name: string;
    } | null;
}
interface Category {
    id: string;
    name: string;
    description?: string | null;
}
interface Applicant {
    id: string; status: string; appliedAt: string; resumeUrl: string;
    score?: number | null;
    applicant: { id: string; username: string; email: string };
}

interface JobQuestion {
    id: string;
    question: string;
    createdAt: string;
}

type ApplicantsSortMode = "RANKING" | "LATEST";

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

interface GenerateAiJobQuestionsData {
    generateAiJobQuestions: {
        success: boolean;
        queued: boolean;
        requestedCount: number;
        availableSlots: number;
        message: string;
    };
}

interface DeleteJobQuestionData {
    deleteJobQuestion: {
        success: boolean;
    };
}

interface DeleteAllJobQuestionsData {
    deleteAllJobQuestions: {
        success: boolean;
        deletedCount: number;
    };
}

interface QueueAiJobDraftData {
    queueAiJobDraft: {
        success: boolean;
        queued: boolean;
        requestId: string;
        message?: string;
    };
}

interface AiJobDraftResultData {
    aiJobDraftResult: {
        requestId: string;
        status: string;
        message?: string;
        generatedDescription?: string | null;
        suggestedSkillIds?: number[] | null;
        suggestedSkillNames?: string[] | null;
    };
}

type Tab = "jobs" | "post" | "applicants";

const DASHBOARD_TAB_STORAGE_KEY = "company-dashboard-active-tab";
const DASHBOARD_SELECTED_JOB_STORAGE_KEY = "company-dashboard-selected-job-id";
const DASHBOARD_TABS: Tab[] = ["jobs", "post", "applicants"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    applied: { label: "Applied", color: "bg-blue-100 text-blue-700" },
    reviewing: { label: "Reviewing", color: "bg-amber-100 text-amber-700" },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
    hired: { label: "Hired! 🎉", color: "bg-emerald-100 text-emerald-700" },
};

const STATUS_OPTIONS = ["applied", "reviewing", "shortlisted", "rejected", "hired"];

const TITLE_TEMPLATES = [
    "Senior Frontend Engineer (React + TypeScript)",
    "Backend Python Developer (Django + GraphQL)",
    "Full Stack Engineer (React, Django, PostgreSQL)",
    "DevOps Engineer (Docker, CI/CD, AWS)",
];

const isDescriptiveTitle = (title: string) => {
    const trimmed = (title || "").trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    return trimmed.length >= 12 && words.length >= 3;
};

/* ─── Schema ────────────────────────────────────────── */
const jobSchema = z.object({
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .refine((value) => isDescriptiveTitle(value), "Use a descriptive title (at least 3 words)"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    location: z.string().optional(),
    salaryRange: z.string().optional(),
    minimumExperienceRequired: z.coerce.number().min(0, "Minimum experience must be 0 or greater"),
    scoreWeightSkill: z.coerce.number().min(0).max(1),
    scoreWeightCategory: z.coerce.number().min(0).max(1),
    scoreWeightExperience: z.coerce.number().min(0).max(1),
    scoreWeightSemantic: z.coerce.number().min(0).max(1),
    categoryIds: z.array(z.string()).default([]),
    skillIds: z.array(z.string()).default([]),
}).refine((v) => {
    const sum = v.scoreWeightSkill + v.scoreWeightCategory + v.scoreWeightExperience + v.scoreWeightSemantic;
    return Math.abs(sum - 1) < 0.001;
}, {
    message: "Scoring weights must sum to 1.0",
    path: ["scoreWeightSkill"],
});

type JobFormValues = z.infer<typeof jobSchema>;

/* ─── Validation Adapter ────────────────────────────── */
const validateWithZod = (schema: z.ZodSchema) => (values: unknown) => {
    try {
        schema.parse(values);
    } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            return err.flatten().fieldErrors;
        }
    }
};

/* ─── JobForm ────────────────────────────────────────── */
interface JobFormProps {
    initial?: Partial<JobFormValues>;
    allCategories: Category[];
    allSkills: Skill[];
    onSubmit: (v: JobFormValues) => void;
    onAiGenerateDescription: (title: string) => Promise<string | null>;
    onAiGenerateSkills: (title: string) => Promise<string[] | null>;
    aiDescriptionLoading?: boolean;
    aiSkillsLoading?: boolean;
    loading: boolean;
    submitLabel?: string;
}

function JobForm({
    initial,
    allCategories,
    allSkills,
    onSubmit,
    onAiGenerateDescription,
    onAiGenerateSkills,
    aiDescriptionLoading = false,
    aiSkillsLoading = false,
    loading,
    submitLabel = "Save",
}: JobFormProps) {
    const [categorySearch, setCategorySearch] = useState("");
    const [skillSearch, setSkillSearch] = useState("");

    const initialValues: JobFormValues = {
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        location: initial?.location ?? "",
        salaryRange: initial?.salaryRange ?? "",
        minimumExperienceRequired: initial?.minimumExperienceRequired ?? 0,
        scoreWeightSkill: initial?.scoreWeightSkill ?? 0.5,
        scoreWeightCategory: initial?.scoreWeightCategory ?? 0.2,
        scoreWeightExperience: initial?.scoreWeightExperience ?? 0.15,
        scoreWeightSemantic: initial?.scoreWeightSemantic ?? 0.15,
        categoryIds: initial?.categoryIds ?? [],
        skillIds: initial?.skillIds ?? [],
    };

    return (
        <Formik
            initialValues={initialValues}
            validate={validateWithZod(jobSchema)}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ isValid, dirty, values, setFieldValue }) => {
                const normalizedCategoryQuery = categorySearch.trim().toLowerCase();
                const selectedCategoryIds = new Set(values.categoryIds);
                const titleIsDescriptive = isDescriptiveTitle(values.title);
                const scoringWeightTotal = Number(values.scoreWeightSkill || 0) + Number(values.scoreWeightCategory || 0) + Number(values.scoreWeightExperience || 0) + Number(values.scoreWeightSemantic || 0);
                const filteredCategories = allCategories
                    .filter((category) => {
                        if (!normalizedCategoryQuery) {
                            return true;
                        }
                        return category.name.toLowerCase().includes(normalizedCategoryQuery);
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                const normalizedQuery = skillSearch.trim().toLowerCase();
                const selectedSkillIds = new Set(values.skillIds);
                const filteredSkills = allSkills.filter((skill) => {
                    if (!normalizedQuery) {
                        return true;
                    }

                    const haystack = `${skill.name} ${skill.category?.name ?? ""}`.toLowerCase();
                    return haystack.includes(normalizedQuery);
                });

                const selectedSkills = allSkills
                    .filter((skill) => selectedSkillIds.has(skill.id))
                    .sort((a, b) => a.name.localeCompare(b.name));

                const remainingSkills = filteredSkills
                    .filter((skill) => !selectedSkillIds.has(skill.id))
                    .sort((a, b) => a.name.localeCompare(b.name));

                return (
                <Form className="space-y-4 max-h-[80vh] overflow-scroll px-1 text-gray-900 dark:text-slate-100">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <Field as={Input} name="title" placeholder="e.g. Senior Frontend Engineer" />
                        <ErrorMessage name="title" component="p" className="text-xs text-red-500 mt-1" />
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Tip: make the title specific, for example “Senior Frontend Engineer (React + TypeScript)”.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {TITLE_TEMPLATES.map((template) => (
                                <button
                                    key={template}
                                    type="button"
                                    onClick={() => setFieldValue("title", template)}
                                    className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                >
                                    Use: {template}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Location</label>
                            <Field as={Input} name="location" placeholder="e.g. Bangalore / Remote" />
                            <ErrorMessage name="location" component="p" className="text-xs text-red-500 mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Salary Range</label>
                            <Field as={Input} name="salaryRange" placeholder="e.g. ₹8L – ₹14L" />
                            <ErrorMessage name="salaryRange" component="p" className="text-xs text-red-500 mt-1" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">
                            Minimum Experience Required (years)
                        </label>
                        <Field
                            as={Input}
                            type="number"
                            min="0"
                            name="minimumExperienceRequired"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (["-", "+", "e", "E"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                                const pasted = e.clipboardData.getData("text");
                                if (!/^\d+$/.test(pasted)) {
                                    e.preventDefault();
                                }
                            }}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                const input = e.currentTarget;
                                input.value = input.value.replace(/\D+/g, "");
                            }}
                            onWheel={(e: React.WheelEvent<HTMLInputElement>) => {
                                e.currentTarget.blur();
                            }}
                        />
                        <ErrorMessage name="minimumExperienceRequired" component="p" className="text-xs text-red-500 mt-1" />
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/40">
                        <label className="text-sm font-semibold text-gray-800 dark:text-slate-200 block mb-2">Scoring Ratio Weights</label>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Set weights used in final score. Total must be 1.0.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Skill Weight</label>
                                <Field as={Input} type="number" min="0" max="1" step="0.05" name="scoreWeightSkill" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Category Weight</label>
                                <Field as={Input} type="number" min="0" max="1" step="0.05" name="scoreWeightCategory" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Experience Weight</label>
                                <Field as={Input} type="number" min="0" max="1" step="0.05" name="scoreWeightExperience" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Semantic Weight</label>
                                <Field as={Input} type="number" min="0" max="1" step="0.05" name="scoreWeightSemantic" />
                            </div>
                        </div>
                        <p className={`text-xs mt-2 ${Math.abs(scoringWeightTotal - 1) < 0.001 ? "text-emerald-600" : "text-red-500"}`}>
                            Total: {scoringWeightTotal.toFixed(2)}
                        </p>
                        <ErrorMessage name="scoreWeightSkill" component="p" className="text-xs text-red-500 mt-1" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">
                            Job Categories
                        </label>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder="Search categories..."
                                className="pl-9"
                            />
                        </div>

                        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                            {filteredCategories.length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 px-2 py-1">No categories found.</p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {filteredCategories.map((category) => {
                                    const checked = selectedCategoryIds.has(category.id);
                                    return (
                                        <label
                                            key={category.id}
                                            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const next = e.target.checked
                                                        ? [...values.categoryIds, category.id]
                                                        : values.categoryIds.filter((id) => id !== category.id);
                                                    setFieldValue("categoryIds", next);
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-200">{category.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Selected: {values.categoryIds.length}</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">
                                Skills for Resume Shortlisting
                            </label>
                            {titleIsDescriptive && (
                                <Button
                                    type="button"
                                    // variant="outline"
                                    size="sm"
                                    disabled={aiDescriptionLoading || aiSkillsLoading}
                                    onClick={async () => {
                                        const suggestedIds = await onAiGenerateSkills(values.title);
                                        if (suggestedIds && suggestedIds.length > 0) {
                                            const merged = Array.from(new Set([...(values.skillIds ?? []), ...suggestedIds]));
                                            setFieldValue("skillIds", merged);
                                        }
                                    }}
                                    className="border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                                >
                                    {aiSkillsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                                    AI Skills
                                </Button>
                            )}
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                                placeholder="Search skills..."
                                className="pl-9"
                            />
                        </div>

                        <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 space-y-2">
                            {filteredSkills.length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 px-2 py-1">No skills found.</p>
                            )}

                            {selectedSkills.length > 0 && (
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50/20 dark:bg-transparent p-2">
                                    <p className="text-xs font-semibold text-indigo-700 mb-1">Selected Skills</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                        {selectedSkills.map((skill) => {
                                            const checked = values.skillIds.includes(skill.id);
                                            return (
                                                <label
                                                    key={skill.id}
                                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-indigo-50 dark:hover:hover:bg-slate-800 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = e.target.checked
                                                                ? [...values.skillIds, skill.id]
                                                                : values.skillIds.filter((id) => id !== skill.id);
                                                            setFieldValue("skillIds", next);
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-slate-200">{skill.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {remainingSkills.length > 0 && (
                                <div className="rounded-lg border border-gray-100 dark:border-slate-700 p-2">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">All Skills</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                        {remainingSkills.map((skill) => {
                                            const checked = values.skillIds.includes(skill.id);
                                            return (
                                                <label
                                                    key={skill.id}
                                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = e.target.checked
                                                                ? [...values.skillIds, skill.id]
                                                                : values.skillIds.filter((id) => id !== skill.id);
                                                            setFieldValue("skillIds", next);
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-slate-200">{skill.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Selected: {values.skillIds.length}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">These skills are used internally for ranking resumes and are not shown to candidates.</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">
                                Description <span className="text-red-500">*</span>
                            </label>
                            {titleIsDescriptive && (
                                <Button
                                    type="button"
                                    // variant="outline"
                                    size="sm"
                                    disabled={aiDescriptionLoading || aiSkillsLoading}
                                    onClick={async () => {
                                        const generated = await onAiGenerateDescription(values.title);
                                        if (generated) {
                                            setFieldValue("description", generated);
                                        }
                                    }}
                                    className="border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                                >
                                    {aiDescriptionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                                    AI Description
                                </Button>
                            )}
                        </div>
                        <Field
                            as="textarea"
                            name="description"
                            rows={6}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                        <ErrorMessage name="description" component="p" className="text-xs text-red-500 mt-1" />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading || !isValid || !dirty}
                            className="bg-linear-to-r from-indigo-600 to-violet-600 text-white px-8"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            {submitLabel}
                        </Button>
                    </div>
                </Form>
                );
            }}
        </Formik>
    );
}

/* ─── Main Component ─────────────────────────────────── */
export default function CompanyDashboard() {
    const navigate = useNavigate();
    const client = useApolloClient();
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (typeof window === "undefined") {
            return "jobs";
        }

        const savedTab = window.localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY);
        return DASHBOARD_TABS.includes(savedTab as Tab) ? (savedTab as Tab) : "jobs";
    });
    const [editJob, setEditJob] = useState<Job | null>(null);
    const [deleteJob, setDeleteJobState] = useState<Job | null>(null);
    const [questionsJob, setQuestionsJob] = useState<Job | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        return window.localStorage.getItem(DASHBOARD_SELECTED_JOB_STORAGE_KEY);
    });
    const [applicantsSortMode, setApplicantsSortMode] = useState<ApplicantsSortMode>("RANKING");
    const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
    const [awaitingGeneratedQuestions, setAwaitingGeneratedQuestions] = useState(false);
    const [baselineQuestionCount, setBaselineQuestionCount] = useState<number | null>(null);
    const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
    const [aiSkillsLoading, setAiSkillsLoading] = useState(false);
    const questionPollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionPollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        window.localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (selectedJobId) {
            window.localStorage.setItem(DASHBOARD_SELECTED_JOB_STORAGE_KEY, selectedJobId);
        }
    }, [selectedJobId]);

    /* ── Queries ── */
    const { data: jobsData, loading: jobsLoading, refetch: refetchJobs } =
        useQuery<{ companyJobs: Job[] }>(GET_COMPANY_JOBS);
    const { data: skillsData } = useQuery<{ allSkills: Skill[] }>(GET_ALL_SKILLS);
    const { data: categoriesData } = useQuery<{ allCategories: Category[] }>(GET_ALL_CATEGORIES);
    const defaultSelectedJobId = selectedJobId ?? jobsData?.companyJobs?.[0]?.id ?? null;
    const { data: applicantsData, loading: applicantsLoading } =
        useQuery<{ jobApplicants: Applicant[] }>(GET_JOB_APPLICANTS, {
            variables: {
                jobId: Number(defaultSelectedJobId),
                sortBy: applicantsSortMode,
            },
            skip: !defaultSelectedJobId,
        });
    const {
        data: questionsData,
        loading: questionsLoading,
        refetch: refetchQuestions,
    } = useQuery<{ jobQuestions: JobQuestion[] }>(GET_JOB_QUESTIONS, {
        variables: { jobId: Number(questionsJob?.id) },
        skip: !questionsJob?.id,
        fetchPolicy: "network-only",
    });

    /* ── Mutations ── */
    const flash = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
        if (actionLabel && onAction) {
            toast.success(
                <div className="flex items-center gap-2">
                    <span>{message}</span>
                    <button
                        type="button"
                        className="underline underline-offset-2 font-semibold"
                        onClick={(event) => {
                            event.stopPropagation();
                            onAction();
                            toast.dismiss();
                        }}
                    >
                        {actionLabel}
                    </button>
                </div>,
                {
                    autoClose: 6000,
                    closeOnClick: false,
                }
            );
            return;
        }

        toast.success(message, { autoClose: 6000 });
    }, []);

    const flashError = useCallback((message: string) => {
        toast.error(message, { autoClose: 6000 });
    }, []);

    const [createJob, { loading: creating }] = useMutation<CreateJobData>(CREATE_JOB, {
        onCompleted() { refetchJobs(); flash("Job posted successfully!"); setActiveTab("jobs"); },
        onError(error) { flashError("Error: " + error.message); },
    });
    const [updateJob, { loading: updating }] = useMutation<UpdateJobData>(UPDATE_JOB, {
        update(cache, { data }) {
            const updatedJob = data?.updateJob?.job;
            if (!updatedJob) {
                return;
            }

            const existing = cache.readQuery<{ companyJobs: Job[] }>({ query: GET_COMPANY_JOBS });
            if (!existing?.companyJobs) {
                return;
            }

            cache.writeQuery({
                query: GET_COMPANY_JOBS,
                data: {
                    companyJobs: existing.companyJobs.map((job) =>
                        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
                    ),
                },
            });
        },
    });
    const [deleteJobMut, { loading: deleting }] = useMutation<DeleteJobData>(DELETE_JOB, {
        onCompleted() { refetchJobs(); setDeleteJobState(null); flash("Job deleted."); },
    });
    const [updateStatus] = useMutation<UpdateApplicationStatusData>(UPDATE_APPLICATION_STATUS, {
        onCompleted() { },
    });
    const [generateAiQuestions, { loading: generatingAiQuestions }] =
        useMutation<GenerateAiJobQuestionsData>(GENERATE_AI_JOB_QUESTIONS, {
            onCompleted(data) {
                const message = data.generateAiJobQuestions?.message || "AI question generation queued";
                flash(message);
            },
            onError(error) {
                flashError("Error: " + error.message);
            },
        });
    const [deleteQuestion, { loading: deletingQuestion }] =
        useMutation<DeleteJobQuestionData>(DELETE_JOB_QUESTION, {
            onCompleted() {
                flash("Question deleted");
                refetchQuestions();
                refetchJobs();
            },
            onError(error) {
                flashError("Error: " + error.message);
            },
        });
    const [deleteAllQuestions, { loading: deletingAllQuestions }] =
        useMutation<DeleteAllJobQuestionsData>(DELETE_ALL_JOB_QUESTIONS, {
            onCompleted(data) {
                const count = data.deleteAllJobQuestions?.deletedCount ?? 0;
                flash(count > 0 ? `Deleted ${count} questions.` : "No questions to delete.");
                refetchQuestions();
                refetchJobs();
            },
            onError(error) {
                flashError("Error: " + error.message);
            },
        });
    const [queueAiJobDraft] = useMutation<QueueAiJobDraftData>(QUEUE_AI_JOB_DRAFT);

    const handleToggleJobStatus = useCallback(async (job: Job) => {
        const nextStatus = !job.isActive;

        try {
            await updateJob({
                variables: {
                    jobId: Number(job.id),
                    isActive: nextStatus,
                },
            });
            flash(`Job ${nextStatus ? "activated" : "deactivated"}.`);
        } catch (error) {
            flashError(error instanceof Error ? error.message : "Unable to update job status.");
        }
    }, [flash, flashError, updateJob]);

    const handleSaveJob = useCallback(async (jobId: string, values: JobFormValues) => {
        try {
            await updateJob({
                variables: {
                    jobId: Number(jobId),
                    title: values.title,
                    description: values.description,
                    location: values.location || null,
                    salaryRange: values.salaryRange || null,
                    minimumExperienceRequired: Number(values.minimumExperienceRequired || 0),
                    scoreWeightSkill: Number(values.scoreWeightSkill || 0.5),
                    scoreWeightCategory: Number(values.scoreWeightCategory || 0.2),
                    scoreWeightExperience: Number(values.scoreWeightExperience || 0.15),
                    scoreWeightSemantic: Number(values.scoreWeightSemantic || 0.15),
                    categories: (values.categoryIds ?? []).map((categoryId) => Number(categoryId)),
                    skills: (values.skillIds ?? []).map((skillId) => Number(skillId)),
                },
            });

            setEditJob(null);
            flash("Job updated!");
        } catch (error) {
            flashError(error instanceof Error ? error.message : "Unable to update job.");
        }
    }, [flash, flashError, updateJob]);

    const pollAiJobDraft = useCallback(async (requestId: string) => {
        const started = Date.now();
        const timeoutMs = 35000;
        const intervalMs = 2500;

        while (Date.now() - started < timeoutMs) {
            const { data } = await client.query<AiJobDraftResultData>({
                query: GET_AI_JOB_DRAFT_RESULT,
                variables: { requestId },
                fetchPolicy: "network-only",
            });

            const result = data?.aiJobDraftResult;
            if (!result) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
                continue;
            }

            const status = (result.status || "").toLowerCase();
            if (status === "completed" || status === "failed" || status === "not_found") {
                return result;
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }

        return null;
    }, [client]);

    const handleAiGenerateDescription = useCallback(async (title: string) => {
        if (!isDescriptiveTitle(title)) {
            flashError("Enter a more descriptive job title first.");
            return null;
        }

        setAiDescriptionLoading(true);
        try {
            const { data } = await queueAiJobDraft({
                variables: {
                    title: title.trim(),
                    kind: "description",
                },
            });

            const requestId = data?.queueAiJobDraft?.requestId;
            if (!requestId) {
                flashError("Could not queue AI description generation.");
                return null;
            }

            flash("Generating AI description...");
            const result = await pollAiJobDraft(requestId);
            if (!result || (result.status || "").toLowerCase() !== "completed") {
                flashError(result?.message || "AI description generation failed.");
                return null;
            }

            const description = (result.generatedDescription || "").trim();
            if (!description) {
                flashError("AI returned an empty description.");
                return null;
            }

            flash("AI description added.");
            return description;
        } catch (error) {
            flashError(error instanceof Error ? error.message : "Failed to generate AI description.");
            return null;
        } finally {
            setAiDescriptionLoading(false);
        }
    }, [flash, flashError, pollAiJobDraft, queueAiJobDraft]);

    const handleAiGenerateSkills = useCallback(async (title: string) => {
        if (!isDescriptiveTitle(title)) {
            flashError("Enter a more descriptive job title first.");
            return null;
        }

        setAiSkillsLoading(true);
        try {
            const { data } = await queueAiJobDraft({
                variables: {
                    title: title.trim(),
                    kind: "skills",
                    maxSkills: 10,
                },
            });

            const requestId = data?.queueAiJobDraft?.requestId;
            if (!requestId) {
                flashError("Could not queue AI skill suggestions.");
                return null;
            }

            flash("Generating AI skills...");
            const result = await pollAiJobDraft(requestId);
            if (!result || (result.status || "").toLowerCase() !== "completed") {
                flashError(result?.message || "AI skills generation failed.");
                return null;
            }

            const skillIds = (result.suggestedSkillIds ?? []).map((id) => String(id));
            if (!skillIds.length) {
                flashError("AI could not map skills from title.");
                return null;
            }

            flash("AI skills selected.");
            return skillIds;
        } catch (error) {
            flashError(error instanceof Error ? error.message : "Failed to generate AI skills.");
            return null;
        } finally {
            setAiSkillsLoading(false);
        }
    }, [flash, flashError, pollAiJobDraft, queueAiJobDraft]);

    const jobs = useMemo(() => jobsData?.companyJobs ?? [], [jobsData?.companyJobs]);
    const allSkills = skillsData?.allSkills ?? [];
    const allCategories = categoriesData?.allCategories ?? [];
    const applicants = applicantsData?.jobApplicants ?? [];
    const questions = questionsData?.jobQuestions ?? [];
    const maxQuestions = 20;
    const remainingQuestionSlots = Math.max(maxQuestions - questions.length, 0);
    const isAwaitingQuestionsResult =
        awaitingGeneratedQuestions &&
        baselineQuestionCount !== null &&
        questions.length <= baselineQuestionCount;

    const clearQuestionsPolling = useCallback(() => {
        if (questionPollingIntervalRef.current) {
            clearInterval(questionPollingIntervalRef.current);
            questionPollingIntervalRef.current = null;
        }
        if (questionPollingTimeoutRef.current) {
            clearTimeout(questionPollingTimeoutRef.current);
            questionPollingTimeoutRef.current = null;
        }
    }, []);

    const closeQuestionsDialog = useCallback(() => {
        clearQuestionsPolling();
        setAwaitingGeneratedQuestions(false);
        setBaselineQuestionCount(null);
        setQuestionsJob(null);
    }, [clearQuestionsPolling]);
    useEffect(() => {
        return () => {
            clearQuestionsPolling();
        };
    }, [clearQuestionsPolling]);

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-full">
            <DashboardLayout
                hideHeader
                sidebarContent={
                    <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                        <TabsTrigger
                            value="jobs"
                            className="pl-10 justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 data-[state=active]:shadow-none transition-all border-none shadow-none w-full"
                        >
                            <Briefcase className="w-4 h-4" />
                            <span>My Jobs</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="applicants"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 data-[state=active]:shadow-none transition-all border-none shadow-none w-full"
                        >
                            <Users className="w-4 h-4" />
                            <span>Applicants</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="post"
                            className="justify-start mt-5 gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-700 dark:text-indigo-300 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 data-[state=active]:shadow-none transition-all border-none shadow-none w-full ring-indigo-700 dark:ring-indigo-400 ring-1"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Post a Job</span>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <div className="p-6 max-w-6xl mx-auto">
                    <TabsContent value="jobs" className="mt-0">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Jobs</h1>
                                <Button
                                    onClick={() => setActiveTab("post")}
                                    className="bg-linear-to-r from-indigo-600 to-violet-600 text-white gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Post New Job
                                </Button>
                            </div>

                            {/* ... existing jobs code ... */}
                            {jobsLoading && jobs.length === 0 && (
                                <ListItemSkeleton count={4} />
                            )}

                            {!jobsLoading && jobs.length === 0 && (
                                <div className="flex flex-col items-center py-16 gap-3 text-gray-400 dark:text-gray-500">
                                    <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                    <p className="font-medium text-gray-500 dark:text-gray-400">No jobs yet</p>
                                    <Button onClick={() => setActiveTab("post")} variant="outline" size="sm" className="dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800">
                                        Post your first job
                                    </Button>
                                </div>
                            )}

                            {jobs.map((job) => (
                                <div key={job.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                                    className="font-semibold text-indigo-600 dark:text-indigo-300 text-lg truncate hover:text-indigo-600/80 dark:hover:text-indigo-200 cursor-pointer transition-colors text-left flex-1"
                                                    title="View job listing"
                                                >
                                                    {job.title}
                                                </button>
                                                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${job.isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300"
                                                    }`}>
                                                    {job.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                                                <span className="text-gray-400 dark:text-gray-500 text-xs">
                                                    Posted {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{job.description}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Min Experience: <span className="font-medium">{job.minimumExperienceRequired} years</span>
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                title={job.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => handleToggleJobStatus(job)}
                                                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                {job.isActive
                                                    ? <ToggleRight className="w-5 h-5 text-emerald-600" />
                                                    : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                            </button>
                                            <button
                                                title={`View applicants (${job.applicationCount ?? 0})`}
                                                onClick={() => { setSelectedJobId(job.id); setActiveTab("applicants"); }}
                                                className="inline-flex items-center gap-1.5 p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                            >
                                                <Users className="w-5 h-5" />
                                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                                    {job.applicationCount ?? 0}
                                                </span>
                                            </button>
                                            <button
                                                title="Edit"
                                                onClick={() => setEditJob(job)}
                                                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                title="Manage interview questions"
                                                onClick={() => setQuestionsJob(job)}
                                                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                            >
                                                <Sparkles className={`w-5 h-5 ${(job.questionCount ?? 0) > 0 ? "text-amber-500" : ""}`} />
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={() => setDeleteJobState(job)}
                                                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 transition-colors"
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
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Post a New Job</h1>
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                                <JobForm
                                    allCategories={allCategories}
                                    allSkills={allSkills}
                                    onAiGenerateDescription={handleAiGenerateDescription}
                                    onAiGenerateSkills={handleAiGenerateSkills}
                                    aiDescriptionLoading={aiDescriptionLoading}
                                    aiSkillsLoading={aiSkillsLoading}
                                    loading={creating}
                                    submitLabel="Post Job"
                                    onSubmit={(v) =>
                                        createJob({
                                            variables: {
                                                title: v.title,
                                                description: v.description,
                                                location: v.location || null,
                                                salaryRange: v.salaryRange || null,
                                                minimumExperienceRequired: Number(v.minimumExperienceRequired || 0),
                                                scoreWeightSkill: Number(v.scoreWeightSkill || 0.5),
                                                scoreWeightCategory: Number(v.scoreWeightCategory || 0.2),
                                                scoreWeightExperience: Number(v.scoreWeightExperience || 0.15),
                                                scoreWeightSemantic: Number(v.scoreWeightSemantic || 0.15),
                                                categories: (v.categoryIds ?? []).map((categoryId) => Number(categoryId)),
                                                skills: (v.skillIds ?? []).map((skillId) => Number(skillId)),
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="applicants" className="mt-0">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Applicants</h1>
                            {/* Job selector */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Select a Job to View Applicants</label>
                                <div className="flex flex-wrap gap-2">
                                    {jobs.map((job) => (
                                        <button
                                            key={job.id}
                                            onClick={() => setSelectedJobId(job.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${defaultSelectedJobId === job.id
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
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

                            {defaultSelectedJobId && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">See applicants by:</span>
                                    <button
                                        type="button"
                                        onClick={() => setApplicantsSortMode("RANKING")}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                            applicantsSortMode === "RANKING"
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                                        }`}
                                    >
                                        Ranking
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApplicantsSortMode("LATEST")}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                            applicantsSortMode === "LATEST"
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                                        }`}
                                    >
                                        Latest application
                                    </button>
                                </div>
                            )}

                            {defaultSelectedJobId && (
                                <div className="mt-8 space-y-4">
                                    {applicantsLoading && (
                                        <ListItemSkeleton count={3} />
                                    )}
                                    {!applicantsLoading && applicants.length === 0 && (
                                        <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                                            <CircleOff className="w-8 h-8 text-gray-300" />
                                            <p className="font-medium text-gray-500">No applicants yet for this job</p>
                                        </div>
                                    )}
                                    {applicants.map((app) => {
                                        const currentStatus = (statusOverrides[app.id] ?? app.status).toLowerCase();
                                        const s = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.applied;
                                        return (
                                            <div key={app.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{app.applicant.username}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.applicant.email}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        Match score: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{typeof app.score === "number" ? `${Math.round(app.score * 100)}%` : "Pending"}</span>
                                                    </p>
                                                    {app.resumeUrl && (
                                                        <a
                                                            href={app.resumeUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline mt-1 inline-block"
                                                        >
                                                            View Resume →
                                                        </a>
                                                    )}
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${s.color}`}>
                                                        {s.label}
                                                    </span>
                                                    <select
                                                        value={currentStatus}
                                                        onChange={(e) => {
                                                            e.preventDefault();

                                                            const newStatus = e.target.value;

                                                            setStatusOverrides((prev) => ({
                                                                ...prev,
                                                                [app.id]: newStatus
                                                            }));

                                                            updateStatus({
                                                                variables: {
                                                                applicationId: Number(app.id),
                                                                status: newStatus
                                                                }
                                                            });
                                                        }}
                                                        className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                <Dialog open={!!questionsJob} onOpenChange={(open) => !open && closeQuestionsDialog()}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Interview Questions</DialogTitle>
                            <DialogDescription>
                                {questionsJob?.title} • {questions.length}/{maxQuestions} questions
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 text-sm text-gray-700 flex items-center justify-between gap-3 mb-5">
                            <span>
                                Generate AI questions up to limit. Remaining slots: <strong>{remainingQuestionSlots}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!questionsJob?.id || questions.length === 0 || deletingAllQuestions}
                                    onClick={() => {
                                        if (!questionsJob?.id) return;
                                        const confirmed = window.confirm("Delete all interview questions for this job?");
                                        if (!confirmed) return;
                                        deleteAllQuestions({ variables: { jobId: Number(questionsJob.id) } });
                                    }}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                    {deletingAllQuestions ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                                    Delete All
                                </Button>
                                <Button
                                type="button"
                                disabled={!questionsJob?.id || remainingQuestionSlots <= 0 || generatingAiQuestions}
                                onClick={() => {
                                    if (!questionsJob?.id) {
                                        return;
                                    }
                                    const targetJobId = Number(questionsJob.id);
                                    const currentCount = questions.length;
                                    setBaselineQuestionCount(currentCount);
                                    setAwaitingGeneratedQuestions(true);
                                    flash("We are generating your questions...");

                                    generateAiQuestions({
                                        variables: {
                                            jobId: targetJobId,
                                            count: Math.min(20, remainingQuestionSlots),
                                        },
                                    });

                                    // Queueing is async; poll in background so toasts can notify when ready.
                                    if (questionPollingIntervalRef.current) {
                                        clearInterval(questionPollingIntervalRef.current);
                                    }
                                    questionPollingIntervalRef.current = setInterval(async () => {
                                        const result = await refetchQuestions();
                                        const fetchedCount = result.data?.jobQuestions?.length ?? 0;

                                        if (fetchedCount > currentCount || fetchedCount >= maxQuestions) {
                                            clearQuestionsPolling();
                                            setAwaitingGeneratedQuestions(false);
                                            setBaselineQuestionCount(null);
                                            refetchJobs();
                                            flash("Questions generated successfully.");
                                        }
                                    }, 5000);

                                    if (questionPollingTimeoutRef.current) {
                                        clearTimeout(questionPollingTimeoutRef.current);
                                    }
                                    questionPollingTimeoutRef.current = setTimeout(() => {
                                        clearQuestionsPolling();
                                        setAwaitingGeneratedQuestions(false);
                                        setBaselineQuestionCount(null);
                                    }, 30000);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {generatingAiQuestions ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                                {generatingAiQuestions ? "Queueing..." : "Generate AI Questions"}
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-1">
                            {isAwaitingQuestionsResult && (
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center text-sm text-indigo-700">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating interview questions. They will appear automatically.
                                    </div>
                                </div>
                            )}

                            {questionsLoading && (
                                <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading questions...
                                </div>
                            )}

                            {!questionsLoading && !isAwaitingQuestionsResult && questions.length === 0 && (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                                    No questions yet. Click "Generate AI Questions" to create them.
                                </div>
                            )}

                            {!questionsLoading && questions.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-start gap-3"
                                >
                                    <span className="text-xs font-semibold text-indigo-600 mt-1">Q{index + 1}</span>
                                    <p className="text-sm text-gray-800 flex-1 leading-relaxed">{item.question}</p>
                                    <button
                                        type="button"
                                        title="Delete question"
                                        disabled={deletingQuestion}
                                        onClick={() => {
                                            deleteQuestion({
                                                variables: { questionId: Number(item.id) },
                                            });
                                        }}
                                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={closeQuestionsDialog}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ──────────── Edit Job Dialog ──────────── */}
                <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader className="flex items-center justify-between">
                            <DialogTitle>Edit Job</DialogTitle>

                            <X
                                onClick={() => setEditJob(null)}
                                className="cursor-pointer"
                            />
                        </DialogHeader>
                        {editJob && (
                            <JobForm
                                allCategories={allCategories}
                                allSkills={allSkills}
                                onAiGenerateDescription={handleAiGenerateDescription}
                                onAiGenerateSkills={handleAiGenerateSkills}
                                aiDescriptionLoading={aiDescriptionLoading}
                                aiSkillsLoading={aiSkillsLoading}
                                initial={{
                                    title: editJob.title,
                                    description: editJob.description,
                                    location: editJob.location ?? undefined,
                                    salaryRange: editJob.salaryRange ?? undefined,
                                    minimumExperienceRequired: editJob.minimumExperienceRequired,
                                    scoreWeightSkill: editJob.scoreWeightSkill,
                                    scoreWeightCategory: editJob.scoreWeightCategory,
                                    scoreWeightExperience: editJob.scoreWeightExperience,
                                    scoreWeightSemantic: editJob.scoreWeightSemantic,
                                    categoryIds: (editJob.categories ?? []).map((category) => category.id),
                                    skillIds: (editJob.skills ?? []).map((skill) => skill.id),
                                }}
                                loading={updating}
                                submitLabel="Save Changes"
                                onSubmit={(v) => handleSaveJob(editJob.id, v)}
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
