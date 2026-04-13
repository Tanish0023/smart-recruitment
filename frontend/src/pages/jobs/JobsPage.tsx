import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { Search, MapPin, Briefcase, SlidersHorizontal, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { JobGridSkeleton } from "@/components/AppSkeletons";
import { GET_ALL_JOBS, GET_MY_APPLICATIONS } from "@/graphql/jobs";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string | null;
    salaryRange?: string | null;
    minimumExperienceRequired?: number | null;
    createdAt: string;
    company: { id: string; name: string };
}

interface Application {
    id: string;
    job: { id: string };
}

const PAGE_SIZE = 12;

export default function JobsPage() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const isFetchingMoreRef = useRef(false);
    const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
    const dashboardMenuRef = useRef<HTMLDivElement | null>(null);

    const isApplicant = isAuthenticated && !user?.isRecruiter;

    const { data, loading, error, fetchMore } = useQuery<{ allJobs: Job[] }>(GET_ALL_JOBS, {
        variables: { limit: PAGE_SIZE, offset: 0 },
        notifyOnNetworkStatusChange: true,
    });
    const { data: appsData } = useQuery<{ myApplications: Application[] }>(GET_MY_APPLICATIONS, {
        skip: !isApplicant,
    });

    const jobs = data?.allJobs ?? [];
    const appliedJobIds = new Set(appsData?.myApplications.map(a => a.job.id) ?? []);

    // Filter out jobs already applied to if user is an applicant
    const availableJobs = isApplicant
        ? jobs.filter(job => !appliedJobIds.has(job.id))
        : jobs;

    const filtered = availableJobs.filter((job) => {
        const q = search.toLowerCase();
        const loc = locationFilter.toLowerCase();
        const matchesSearch =
            !q ||
            job.title.toLowerCase().includes(q) ||
            job.company.name.toLowerCase().includes(q) ||
            job.description.toLowerCase().includes(q);
        const matchesLocation =
            !loc || (job.location?.toLowerCase().includes(loc) ?? false);
        return matchesSearch && matchesLocation;
    });

    const uniqueLocations = Array.from(
        new Set(jobs.map((j) => j.location).filter(Boolean))
    ) as string[];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(event.target as Node)) {
                setDashboardMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || !hasMore || search || locationFilter) {
            return;
        }

        const observer = new IntersectionObserver(
            async (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting || isFetchingMoreRef.current) {
                    return;
                }

                isFetchingMoreRef.current = true;
                const result = await fetchMore({
                    variables: {
                        limit: PAGE_SIZE,
                        offset: jobs.length,
                    },
                    updateQuery: (prev, { fetchMoreResult }) => {
                        const next = fetchMoreResult?.allJobs ?? [];
                        if (next.length < PAGE_SIZE) {
                            setHasMore(false);
                        }
                        if (!next.length) {
                            return prev;
                        }

                        const existingIds = new Set(prev.allJobs.map((job) => job.id));
                        const uniqueNext = next.filter((job) => !existingIds.has(job.id));

                        if (!uniqueNext.length) {
                            return prev;
                        }

                        return {
                            allJobs: [...prev.allJobs, ...uniqueNext],
                        };
                    },
                });

                if ((result.data?.allJobs?.length ?? 0) === 0) {
                    setHasMore(false);
                }
                isFetchingMoreRef.current = false;
            },
            { rootMargin: "200px" }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [fetchMore, hasMore, jobs.length, locationFilter, search]);

    function handleDashboard() {
        if (!isAuthenticated) { navigate("/applicant/login"); return; }
        navigate(user?.isRecruiter ? "/company/dashboard" : "/applicant/dashboard");
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-2 rounded-xl">
                            <Rocket size={18} />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600">
                            Smart Recruit
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {isAuthenticated ? (
                            <div className="relative" ref={dashboardMenuRef}>
                                <button
                                    onClick={() => setDashboardMenuOpen((v) => !v)}
                                    className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-all hover:shadow-md shadow-indigo-500/20"
                                >
                                    Dashboard
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                {dashboardMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
                                        <button
                                            onClick={() => {
                                                setDashboardMenuOpen(false);
                                                handleDashboard();
                                            }}
                                            className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            Open dashboard
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDashboardMenuOpen(false);
                                                logout();
                                                navigate("/");
                                            }}
                                            className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                        >
                                            Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-all hover:shadow-md shadow-indigo-500/20"
                            >
                                Sign In / Up
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 text-center px-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-slate-100 leading-tight tracking-tight">
                    Find Your Next{" "}
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-600">
                        Opportunity
                    </span>
                </h1>
                <p className="mt-4 text-gray-500 dark:text-slate-300 text-lg max-w-xl mx-auto">
                    Browse {jobs.length} active job openings from top companies.
                </p>

                {/* Search bar */}
                <div className="mt-8 max-w-2xl mx-auto flex gap-3 flex-col sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search jobs, companies, skills…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Location"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            list="locations"
                            className="w-full sm:w-44 pl-10 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                        />
                        <datalist id="locations">
                            {uniqueLocations.map((l) => <option key={l} value={l} />)}
                        </datalist>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                {/* Stats row */}
                <div className="flex items-center gap-3 mb-6 text-sm text-gray-500 dark:text-slate-400">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>
                        Showing <strong className="text-gray-800 dark:text-slate-200">{filtered.length}</strong> available job{filtered.length !== 1 ? "s" : ""}
                    </span>
                    {(search || locationFilter) && (
                        <button
                            onClick={() => { setSearch(""); setLocationFilter(""); }}
                            className="ml-auto text-indigo-600 hover:underline font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {loading && (
                    <JobGridSkeleton count={6} />
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
                        <p className="font-semibold">Could not load jobs</p>
                        <p className="text-sm mt-1">{error.message}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400 dark:text-slate-400">
                        <Briefcase className="w-12 h-12 text-gray-300 dark:text-slate-600" />
                        <p className="text-lg font-medium text-gray-500 dark:text-slate-300">No jobs found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            actionSlot={
                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    View & Apply
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            }
                        />
                    ))}
                </div>

                {!search && !locationFilter && hasMore && (
                    <div ref={loadMoreRef} className="h-10 mt-6 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading more jobs...
                    </div>
                )}
            </section>
        </div>
    );
}
