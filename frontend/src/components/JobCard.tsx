import { Link } from "react-router-dom";
import { MapPin, DollarSign, Building2, Calendar, ArrowRight } from "lucide-react";

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

interface JobCardProps {
    job: Job;
    actionSlot?: React.ReactNode;
    compact?: boolean;
}

export function JobCard({ job, actionSlot, compact = false }: JobCardProps) {
    const preview = job.description.length > 120
        ? job.description.slice(0, 120) + "…"
        : job.description;

    const dateStr = new Date(job.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });

    return (
        <div className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-gray-900 dark:text-slate-100 text-lg leading-tight hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors line-clamp-2"
                    >
                        {job.title}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-slate-300">{job.company.name}</span>
                    </div>
                </div>

                <Link
                    to={`/jobs/${job.id}`}
                    className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shrink-0 transition-all"
                >
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
                {job.location && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                    </span>
                )}
                {job.salaryRange && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        <DollarSign className="w-3 h-3" />
                        {job.salaryRange}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {dateStr}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                    Experience: {job.minimumExperienceRequired ?? 0}+ yrs
                </span>
            </div>

            {/* Description */}
            {!compact && (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{preview}</p>
            )}

            {/* Footer */}
            {actionSlot && <div className="pt-1 border-t border-gray-100 dark:border-slate-800">{actionSlot}</div>}
        </div>
    );
}
