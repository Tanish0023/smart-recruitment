import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { Search, MapPin, Briefcase, SlidersHorizontal, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { GET_ALL_JOBS, GET_MY_APPLICATIONS } from "@/graphql/jobs";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string | null;
    salaryRange?: string | null;
    createdAt: string;
    company: { id: string; name: string };
}

interface Application {
    id: string;
    job: { id: string };
}

export default function JobsPage() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [locationFilter, setLocationFilter] = useState("");

    const isApplicant = isAuthenticated && !user?.isRecruiter;

    const { data, loading, error } = useQuery<{ allJobs: Job[] }>(GET_ALL_JOBS);
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

    function handleDashboard() {
        if (!isAuthenticated) { navigate("/applicant/login"); return; }
        navigate(user?.isRecruiter ? "/company/dashboard" : "/applicant/dashboard");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-2 rounded-xl">
                            <Rocket size={18} />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600">
                            Smart Recruit
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <button
                                onClick={handleDashboard}
                                className="flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                            >
                                Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <>
                                <Link to="/applicant/login" className="text-sm font-medium text-gray-600 hover:text-indigo-700">
                                    Sign In
                                </Link>
                                <Link
                                    to="/applicant/register"
                                    className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-all hover:shadow-md"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 text-center px-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                    Find Your Next{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Opportunity
                    </span>
                </h1>
                <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
                    Browse {jobs.length} active job openings from top companies.
                </p>

                {/* Search bar */}
                <div className="mt-8 max-w-2xl mx-auto flex gap-3 flex-col sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs, companies, skills…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Location"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            list="locations"
                            className="w-full sm:w-44 pl-10 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>
                        Showing <strong className="text-gray-800">{filtered.length}</strong> available job{filtered.length !== 1 ? "s" : ""}
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
                    <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Loading jobs…</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
                        <p className="font-semibold">Could not load jobs</p>
                        <p className="text-sm mt-1">{error.message}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                        <Briefcase className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No jobs found</p>
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
            </section>
        </div>
    );
}
