import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
    CheckCircle2,
    Circle,
    Sparkles,
    Trophy,
    Loader2,
    Bell,
    Rocket,
    UserCircle2,
    Code2,
    FileText,
    MapPin,
    XCircle,
    Star,
    Clock,
    UserCheck,
    Search,
    X,
    Phone,
    Globe2,
    ChevronDown,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ListItemSkeleton } from "@/components/AppSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    COMPLETE_APPLICANT_ONBOARDING,
    GET_ME,
    UPDATE_APPLICANT_PROFILE_SECTION,
    UPLOAD_PRIMARY_RESUME,
} from "@/graphql/auth";
import { GET_MY_APPLICATIONS, GET_ALL_SKILLS } from "@/graphql/jobs";

/* ─────────── Interfaces ─────────── */

interface SkillOption {
    id: string;
    name: string;
    category?: { id: string; name: string } | null;
}

interface ProfileSections {
    basicInfo?: boolean;
    skills?: boolean;
    resume?: boolean;
}

interface MeUser {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;

    skills?: SkillOption[];
    profileCompletion?: number;
    profileSections?: ProfileSections;
    primaryResumeUrl?: string | null;
    nudgeMessages?: string[];
}

interface Application {
    id: string;
    status: string;
    appliedAt: string;
    job: {
        id: string;
        title: string;
        location?: string | null;
        company: { id: string; name: string };
    };
}

interface CountryInfo {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
}

type ProfileSectionKey = "skills";

/* ─────────── Status Config ─────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    applied: { label: "Applied", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3.5 h-3.5" /> },
    reviewing: { label: "Reviewing", color: "bg-amber-100 text-amber-700", icon: <Star className="w-3.5 h-3.5" /> },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700", icon: <UserCheck className="w-3.5 h-3.5" /> },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
    hired: { label: "Hired", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

/* ─────────── Section Meta ─────────── */

const SECTION_META: Record<
    ProfileSectionKey,
    { label: string; hint: string; icon: React.ReactNode; important?: boolean; placeholder: string }
> = {
    skills: {
        label: "Skills",
        hint: "Add your key skills",
        icon: <Code2 className="w-5 h-5" />,
        placeholder: "Search and select skills...",
    },
};

/* ─────────── Searchable Dropdown Component ─────────── */

function SearchableDropdown({
    label,
    icon,
    options,
    value,
    onChange,
    loading,
    placeholder = "Search...",
    renderOption,
}: {
    label: string;
    icon?: React.ReactNode;
    options: { value: string; label: string; extra?: string }[];
    value: string;
    onChange: (val: string) => void;
    loading?: boolean;
    placeholder?: string;
    renderOption?: (opt: { value: string; label: string; extra?: string }) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search) return options;
        const q = search.toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q) || o.extra?.toLowerCase().includes(q));
    }, [options, search]);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className="flex items-center w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white hover:border-indigo-300 transition-colors gap-2"
            >
                {icon}
                <span className={`flex-1 text-left truncate ${selectedLabel ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-60 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                            placeholder={placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {loading && (
                            <div className="flex items-center justify-center py-4 text-gray-400 text-sm gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="py-4 text-center text-sm text-gray-400">No results found</div>
                        )}
                        {!loading &&
                            filtered.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 ${value === opt.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"
                                        }`}
                                >
                                    {renderOption ? renderOption(opt) : opt.label}
                                    {value === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-indigo-600" />}
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────── Multi-Select Skills Component ─────────── */

function SkillsMultiSelect({
    allSkills,
    selectedIds,
    onChange,
    loading,
}: {
    allSkills: SkillOption[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    loading?: boolean;
}) {
    const [search, setSearch] = useState("");
    const selectedSet = new Set(selectedIds);

    const grouped = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = allSkills.filter((s) => s.name.toLowerCase().includes(q));
        const groups: Record<string, SkillOption[]> = {};
        for (const sk of filtered) {
            const cat = sk.category?.name ?? "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(sk);
        }
        return groups;
    }, [allSkills, search]);

    const selectedSkills = allSkills.filter((s) => selectedSet.has(s.id));

    return (
        <div className="space-y-3">
            {/* Selected chips */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((sk) => (
                        <span
                            key={sk.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full group hover:bg-indigo-200 transition-colors"
                        >
                            {sk.name}
                            <button
                                type="button"
                                onClick={() => onChange(selectedIds.filter((id) => id !== sk.id))}
                                className="text-indigo-400 hover:text-indigo-700 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search skills to add..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                />
            </div>

            {/* Skills list */}
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading skills...
                    </div>
                )}
                {!loading && Object.keys(grouped).length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-400">No skills found</div>
                )}
                {!loading &&
                    Object.entries(grouped).map(([cat, skills]) => (
                        <div key={cat}>
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100 sticky top-0">
                                {cat}
                            </div>
                            {skills.map((sk) => {
                                const isSelected = selectedSet.has(sk.id);
                                return (
                                    <button
                                        key={sk.id}
                                        type="button"
                                        onClick={() =>
                                            onChange(isSelected ? selectedIds.filter((id) => id !== sk.id) : [...selectedIds, sk.id])
                                        }
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-indigo-50 dark:text-white transition-colors border-b border-gray-50 ${isSelected ? "bg-indigo-50/50 text-indigo-700 font-medium" : "text-gray-700"
                                            }`}
                                    >
                                        {isSelected ? (
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                                        )}
                                        {sk.name}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
            </div>

            <p className="text-xs text-gray-500">
                {selectedIds.length} skill{selectedIds.length !== 1 ? "s" : ""} selected
            </p>
        </div>
    );
}

/* ─────────── Main Dashboard ─────────── */

export default function ApplicantDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "profile";
    const setActiveTab = (val: string) => setSearchParams({ tab: val }, { replace: true });
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [onboardingError, setOnboardingError] = useState("");
    const [sectionOpen, setSectionOpen] = useState<ProfileSectionKey | null>(null);

    const [onboardingForm, setOnboardingForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        location: "",
        phoneCodeVal: "IN|+91",

    });


    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [resumeError, setResumeError] = useState("");
    const [isResumeDragActive, setIsResumeDragActive] = useState(false);
    const fullResumeInputRef = useRef<HTMLInputElement | null>(null);
    const skillsOnlyResumeInputRef = useRef<HTMLInputElement | null>(null);

    // Countries data
    const [countries, setCountries] = useState<CountryInfo[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(false);

    const { data: meData, refetch: refetchMe, startPolling, stopPolling } = useQuery<{ me: MeUser }>(GET_ME, { fetchPolicy: "cache-and-network" });
    const { data: appsData, loading: appsLoading } = useQuery<{ myApplications: Application[] }>(GET_MY_APPLICATIONS, { fetchPolicy: "cache-and-network" });

    const { data: skillsData, loading: skillsLoading } = useQuery<{ allSkills: SkillOption[] }>(GET_ALL_SKILLS);

    const [completeOnboarding, { loading: onboardingSaving }] = useMutation(COMPLETE_APPLICANT_ONBOARDING, {
        onCompleted() {
            setOnboardingOpen(false);
            refetchMe();
        },
    });

    const [updateSection, { loading: sectionSaving }] = useMutation(UPDATE_APPLICANT_PROFILE_SECTION, {
        onCompleted() {
            setSectionOpen(null);
            refetchMe();
        },
    });

    const [uploadResume, { loading: uploadingResume }] = useMutation(UPLOAD_PRIMARY_RESUME, {
        onCompleted() {
            setResumeError("");
            startPolling(3000);
            setTimeout(() => stopPolling(), 15000);
            refetchMe();
        },
        onError(err) {
            setResumeError(err.message);
        },
    });

    const me = meData?.me;
    const profileCompletion = me?.profileCompletion ?? 0;
    const sections = me?.profileSections;
    const applications = appsData?.myApplications ?? [];
    const hasPrimaryResume = Boolean(me?.primaryResumeUrl);

    const allSkills = skillsData?.allSkills ?? [];

    // Fetch countries on mount
    const fetchCountries = useCallback(async () => {
        setCountriesLoading(true);
        try {
            const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag");
            const data = await res.json();
            const mapped: CountryInfo[] = data
                .filter((c: { idd?: { root?: string, suffixes?: string[] }, name: { common: string }, cca2: string, flag: string }) => c.idd?.root)
                .map((c: { idd?: { root?: string, suffixes?: string[] }, name: { common: string }, cca2: string, flag: string }) => ({
                    name: c.name.common,
                    code: c.cca2,
                    dialCode: (c.idd?.root ?? "") + (c.idd?.suffixes?.[0] ?? ""),
                    flag: c.flag || "",
                }))
                .sort((a: CountryInfo, b: CountryInfo) => a.name.localeCompare(b.name));
            setCountries(mapped);
        } catch {
            // Fallback with common codes
            setCountries([
                { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
                { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
                { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
                { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
                { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
                { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
            ]);
        } finally {
            setCountriesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    const sectionCards = useMemo(() => {
        return [
            { key: "skills" as const, complete: !!sections?.skills, data: me?.skills },
        ];
    }, [sections, me]);

    /* country options for dropdowns */
    const locationOptions = useMemo(
        () => countries.map((c) => ({ value: c.name, label: `${c.flag} ${c.name}`, extra: c.code })),
        [countries]
    );

    const phoneCodeOptions = useMemo(
        () =>
            countries
                .filter((c) => c.dialCode)
                .map((c) => ({
                    value: `${c.code}|${c.dialCode}`,
                    label: `${c.flag} ${c.dialCode}`,
                    extra: c.name,
                })),
        [countries]
    );

    /* handlers */

    function openOnboarding() {
        // parse out existing phone code if any
        const existingPhone = me?.phone ?? "";
        let phoneCodeVal = "IN|+91";
        let phoneNum = existingPhone;
        // Try to detect country code
        const matchedCountry = countries.find((c) => existingPhone.startsWith(c.dialCode));
        if (matchedCountry) {
            phoneCodeVal = `${matchedCountry.code}|${matchedCountry.dialCode}`;
            phoneNum = existingPhone.slice(matchedCountry.dialCode.length).trim();
        }

        setOnboardingForm({
            firstName: me?.firstName ?? "",
            lastName: me?.lastName ?? "",
            phone: phoneNum,
            location: me?.location ?? "",
            phoneCodeVal,
        });
        setOnboardingError("");
        setOnboardingOpen(true);
    }

    function saveOnboarding() {
        if (!onboardingForm.firstName.trim() || !onboardingForm.lastName.trim() || !onboardingForm.phone.trim() || !onboardingForm.location.trim()) {
            setOnboardingError("Please fill out all required fields.");
            return;
        }
        setOnboardingError("");
        const dialCode = onboardingForm.phoneCodeVal.split("|")[1] ?? "+91";
        const fullPhone = `${dialCode} ${onboardingForm.phone}`.trim();
        completeOnboarding({
            variables: {
                firstName: onboardingForm.firstName,
                lastName: onboardingForm.lastName,
                phone: fullPhone,
                location: onboardingForm.location,

            },
        });
    }

    function openSectionEditor(section: ProfileSectionKey) {
        if (section === "skills") {
            // Pre-fill selected skill IDs
            const existing = (me?.skills as SkillOption[] | undefined) ?? [];
            setSelectedSkillIds(existing.map((s) => s.id));
        }
        setSectionOpen(section);
    }

    function saveSection() {
        if (!sectionOpen) return;
        if (sectionOpen === "skills") {
            updateSection({
                variables: {
                    section: "skills",
                    items: selectedSkillIds.map((id) => parseInt(id)),
                },
            });
        }
    }

    function onResumeSelect(file: File | null, updateBasicDetails = true) {
        setResumeError("");
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setResumeError("Only PDF resumes are supported.");
            return;
        }
        uploadResume({ variables: { resume: file, updateBasicDetails } });
    }

    function onResumeDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsResumeDragActive(false);

        if (uploadingResume) return;

        const droppedFile = e.dataTransfer.files?.[0] ?? null;
        if (!droppedFile) return;

        // First upload can update basic details; subsequent uploads are skills-only.
        onResumeSelect(droppedFile, !hasPrimaryResume);
    }

    function onResumeDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (!uploadingResume) {
            setIsResumeDragActive(true);
        }
    }

    function onResumeDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsResumeDragActive(false);
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <DashboardLayout
                hideHeader
                sidebarContent={
                    <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                        <TabsTrigger
                            value="profile"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 data-[state=active]:shadow-none transition-all border-none shadow-none w-full"
                        >
                            <UserCircle2 className="w-4 h-4" />
                            <span>Profile Builder</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="applications"
                            className="justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 data-[state=active]:shadow-none transition-all border-none shadow-none w-full"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>My Applications</span>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <div className="p-6 max-w-7xl mx-auto">
                    <TabsContent value="profile" className="mt-0 outline-none space-y-6">
                        <div className="bg-linear-to-r from-indigo-600 to-cyan-600 rounded-3xl p-6 text-white">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-indigo-100 text-sm font-medium">Dashboard = Profile Builder</p>
                                    <h1 className="text-2xl font-bold mt-1">Complete your profile ({profileCompletion}%)</h1>
                                    <p className="text-indigo-100 text-sm mt-2">Fill one card at a time and unlock a stronger profile.</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                                    </div>
                                    <p className="text-xs text-indigo-100 mt-2">Progress updates instantly as you complete sections</p>
                                </div>
                            </div>
                        </div>

                        {!sections?.resume && (
                            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Step 1: Upload Your Resume First</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">We'll automatically parse your skills to save you time.</p>
                                </div>
                            </div>
                        )}

                        {sections?.resume && !sections?.basicInfo && (
                            <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-orange-700 dark:text-orange-300 font-semibold">Step 2: super short onboarding (30-60 seconds)</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">First name, last name, phone, and location.</p>
                                </div>
                                <Button onClick={openOnboarding} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                                    Start onboarding
                                </Button>
                            </div>
                        )}

                        {sections?.resume && sections?.basicInfo && !sections?.skills && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Step 3: Review your skills (takes 20 seconds)</p>
                                    <p className="text-sm text-emerald-900/80 dark:text-emerald-200/90">Make sure our AI captured your skills correctly.</p>
                                </div>
                                <Button onClick={() => openSectionEditor("skills")} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    Review skills
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                                <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-cyan-100/50 dark:bg-cyan-500/10 blur-2xl" />
                                <div className="absolute -left-8 -bottom-10 w-24 h-24 rounded-full bg-indigo-100/50 dark:bg-indigo-500/10 blur-2xl" />

                                <div className="relative flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-semibold">
                                            <FileText className="w-5 h-5 text-indigo-600" /> Resume
                                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">PDF only</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">Upload once, then apply instantly to jobs.</p>
                                    </div>
                                    {sections?.resume ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                                            <Circle className="w-3.5 h-3.5" /> Missing
                                        </span>
                                    )}
                                </div>

                                <div
                                    className={`relative mt-4 rounded-xl border border-dashed p-3 space-y-3 transition-colors ${isResumeDragActive
                                        ? "border-indigo-500 bg-indigo-100/70 dark:bg-indigo-500/20"
                                        : "border-indigo-200 dark:border-indigo-700/60 bg-indigo-50/50 dark:bg-indigo-950/25"
                                        }`}
                                    onDrop={onResumeDrop}
                                    onDragOver={onResumeDragOver}
                                    onDragLeave={onResumeDragLeave}
                                >
                                    {me?.primaryResumeUrl && (
                                        <a
                                            href={me.primaryResumeUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline break-all"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Current resume attached
                                        </a>
                                    )}

                                    <input
                                        ref={fullResumeInputRef}
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            onResumeSelect(e.target.files?.[0] || null, true);
                                            e.currentTarget.value = "";
                                        }}
                                    />
                                    <input
                                        ref={skillsOnlyResumeInputRef}
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            onResumeSelect(e.target.files?.[0] || null, false);
                                            e.currentTarget.value = "";
                                        }}
                                    />

                                    <div className="grid grid-cols-1 gap-2">
                                        {!hasPrimaryResume && (
                                            <Button
                                                type="button"
                                                disabled={uploadingResume}
                                                onClick={() => fullResumeInputRef.current?.click()}
                                                className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {uploadingResume ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                Upload Resume
                                            </Button>
                                        )}

                                        {hasPrimaryResume && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={uploadingResume}
                                                onClick={() => skillsOnlyResumeInputRef.current?.click()}
                                                className="h-10 rounded-xl border-indigo-200 dark:border-indigo-700 dark:text-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                            >
                                                {uploadingResume ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                Upload New Resume (Skills Only)
                                            </Button>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-dashed border-indigo-300/80 dark:border-indigo-700/70 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-center">
                                        <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Drag and drop your PDF here</p>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-300 mt-0.5">
                                            {hasPrimaryResume
                                                ? "Dropping a file will update skills only."
                                                : "Dropping a file will upload resume and parse profile details."}
                                        </p>
                                    </div>

                                    {!hasPrimaryResume && (
                                        <p className="text-[11px] text-gray-500 dark:text-slate-300">Tip: first upload can auto-fill missing basic info and skills from your resume.</p>
                                    )}
                                    {hasPrimaryResume && (
                                        <p className="text-[11px] text-gray-500 dark:text-slate-300">Tip: uploading a new resume now refreshes only skills and keeps basic info unchanged.</p>
                                    )}
                                    <p className="text-[11px] text-gray-500 dark:text-slate-300">For better parsing quality, use a text-based PDF (not scanned image).</p>
                                    {resumeError && <p className="text-xs text-red-600 font-medium">{resumeError}</p>}
                                </div>
                            </div>

                            <button
                                onClick={openOnboarding}
                                className="text-left bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-semibold">
                                        <UserCircle2 className="w-5 h-5" /> Basic Info
                                    </div>
                                    {sections?.basicInfo ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-gray-300" />}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-300 mt-2">Name, phone, location</p>
                                <div className="mt-3 space-y-1.5">
                                    <p className="text-xs text-gray-700 dark:text-slate-300 truncate">
                                        <span className="font-semibold text-gray-900 dark:text-slate-100">Name:</span>{" "}
                                        {me?.firstName || me?.lastName
                                            ? `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim()
                                            : "Not added yet"}
                                    </p>
                                    <p className="text-xs text-gray-700 dark:text-slate-300 truncate">
                                        <span className="font-semibold text-gray-900 dark:text-slate-100">Phone:</span>{" "}
                                        {me?.phone?.trim() ? me.phone : "Not added yet"}
                                    </p>
                                    <p className="text-xs text-gray-700 dark:text-slate-300 truncate">
                                        <span className="font-semibold text-gray-900 dark:text-slate-100">Country:</span>{" "}
                                        {me?.location?.trim() ? me.location : "Not added yet"}
                                    </p>
                                </div>
                            </button>

                            {sectionCards.map((section) => {
                                const meta = SECTION_META[section.key];
                                return (
                                    <button
                                        key={section.key}
                                        onClick={() => openSectionEditor(section.key)}
                                        className="text-left bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-semibold">
                                                {meta.icon}
                                                <span>{meta.label}</span>
                                                {meta.important && <span className="text-[10px] uppercase px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full">Important</span>}
                                            </div>
                                            {section.complete ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-gray-300" />}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-slate-300 mt-2">{meta.hint}</p>
                                        {/* Show skill chips on skills card */}
                                        {section.key === "skills" && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {Array.isArray(section.data) && (section.data as SkillOption[]).length > 0 ? (
                                                    <>
                                                        {(section.data as SkillOption[]).slice(0, 5).map((sk) => (
                                                            <span key={sk.id} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                                                                {sk.name}
                                                            </span>
                                                        ))}
                                                        {(section.data as SkillOption[]).length > 5 && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-300 rounded-full">
                                                                +{(section.data as SkillOption[]).length - 5} more
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] text-gray-500 dark:text-slate-300">No skills added yet</span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}


                        </div>

                        {!!me?.nudgeMessages?.length && (
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-semibold">
                                    <Bell className="w-5 h-5 text-indigo-600" /> Smart nudges
                                </div>
                                {me.nudgeMessages.map((msg) => (
                                    <div key={msg} className="text-sm bg-indigo-50 dark:bg-indigo-950/35 text-indigo-800 dark:text-indigo-200 rounded-xl px-3 py-2">
                                        {msg}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" /> Ready to apply faster
                                </p>
                                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Once basic info, skills, and resume are complete, you can apply without re-uploading resume.</p>
                            </div>
                            <Link to="/jobs">
                                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Rocket className="w-4 h-4 mr-2" /> Browse jobs
                                </Button>
                            </Link>
                        </div>
                    </TabsContent>

                    <TabsContent value="applications" className="mt-0 outline-none space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
                            <Link to="/jobs" className="text-indigo-700 dark:text-indigo-300 text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 ring-1 ring-indigo-700 dark:ring-indigo-400 rounded-lg px-2 py-1 cursor-pointer">Browse Jobs</Link>
                        </div>

                        {appsLoading && (
                            <ListItemSkeleton count={4} />
                        )}

                        {!appsLoading && applications.length === 0 && (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl">
                                <Sparkles className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                                <p className="font-medium text-gray-500 dark:text-slate-300">No applications yet</p>
                                <Link to="/jobs" className="text-sm text-indigo-600 dark:text-indigo-300 hover:underline transition-all">
                                    Browse available jobs
                                </Link>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {applications.map((app) => {
                                const s = STATUS_CONFIG[app.status.toLowerCase()] ?? STATUS_CONFIG.applied;
                                const date = new Date(app.appliedAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                });

                                return (
                                    <div key={app.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-all">
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/jobs/${app.job.id}`} className="font-bold text-gray-900 dark:text-slate-100 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-lg">
                                                {app.job.title}
                                            </Link>
                                            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-slate-400">
                                                <span className="font-medium text-gray-700 dark:text-slate-300">{app.job.company.name}</span>
                                                {app.job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {app.job.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 h-full">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${s.color}`}>
                                                {s.icon} {s.label}
                                            </span>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">Applied on</span>
                                                <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{date}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </div>

                {/* ─────────── Onboarding Dialog ─────────── */}
                <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
                    <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Quick onboarding (30-60 seconds)</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            {onboardingError && (
                                <div className="text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 font-medium">
                                    {onboardingError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">First name</label>
                                    <Input
                                        placeholder="John"
                                        value={onboardingForm.firstName}
                                        onChange={(e) => setOnboardingForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Last name</label>
                                    <Input
                                        placeholder="Doe"
                                        value={onboardingForm.lastName}
                                        onChange={(e) => setOnboardingForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Phone with Country Code */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Phone number</label>
                                <div className="flex gap-2 items-center">
                                    <div className="w-32 shrink-0">
                                        <SearchableDropdown
                                            label=""
                                            icon={<Phone className="w-3.5 h-3.5 text-gray-400" />}
                                            options={phoneCodeOptions}
                                            value={onboardingForm.phoneCodeVal}
                                            onChange={(val) => setOnboardingForm((prev) => ({ ...prev, phoneCodeVal: val }))}
                                            loading={countriesLoading}
                                            placeholder="Code"
                                            renderOption={(opt) => {
                                                const [flag, dial] = opt.label.split(" ");
                                                return (
                                                    <div className="flex-1 flex justify-between items-center overflow-hidden gap-1">
                                                        <span className="flex items-center gap-1.5 min-w-0">
                                                            <span className="shrink-0">{flag}</span>
                                                            <span className="text-gray-700 font-medium truncate block">{opt.extra}</span>
                                                        </span>
                                                        <span className="text-gray-400 text-[10px] font-mono shrink-0 pl-1">{dial}</span>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                    <Input
                                        placeholder="999999999"
                                        value={onboardingForm.phone}
                                        onChange={(e) => setOnboardingForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        className="h-10 rounded-xl flex-1 mt-1"
                                    />
                                </div>
                            </div>

                            {/* Location (country picker) */}
                            <SearchableDropdown
                                label="Location"
                                icon={<Globe2 className="w-3.5 h-3.5 text-gray-400" />}
                                options={locationOptions}
                                value={onboardingForm.location}
                                onChange={(val) => setOnboardingForm((prev) => ({ ...prev, location: val }))}
                                loading={countriesLoading}
                                placeholder="Select your country..."
                                renderOption={(opt) => <span>{opt.label}</span>}
                            />


                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOnboardingOpen(false)} className="rounded-xl">Cancel</Button>
                            <Button onClick={saveOnboarding} disabled={onboardingSaving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                {onboardingSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ─────────── Section Editor Dialog ─────────── */}
                <Dialog open={!!sectionOpen} onOpenChange={(open) => !open && setSectionOpen(null)}>
                    <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {sectionOpen ? `Update ${SECTION_META[sectionOpen].label}` : "Update section"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-2 space-y-2">
                            {sectionOpen === "skills" && (
                                <SkillsMultiSelect
                                    allSkills={allSkills}
                                    selectedIds={selectedSkillIds}
                                    onChange={setSelectedSkillIds}
                                    loading={skillsLoading}
                                />
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSectionOpen(null)} className="rounded-xl">Cancel</Button>
                            <Button onClick={saveSection} disabled={sectionSaving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                {sectionSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save section
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </Tabs>
    );
}
