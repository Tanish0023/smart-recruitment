import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, CircleUserRound, LogIn, UserPlus } from "lucide-react";

const cards = [
  {
    title: "Applicant",
    summary: "Browse jobs, keep your profile updated, and apply with one account.",
    signIn: { label: "Applicant sign in", to: "/applicant/login" },
    signUp: { label: "Applicant sign up", to: "/applicant/register" },
    accent: "from-indigo-500 to-violet-600",
    ring: "border-indigo-200 dark:border-indigo-900/60",
    icon: CircleUserRound,
  },
  {
    title: "Recruiter",
    summary: "Post roles, review candidates, and manage hiring from the same login.",
    signIn: { label: "Recruiter sign in", to: "/company/login" },
    signUp: { label: "Recruiter sign up", to: "/company/register" },
    accent: "from-emerald-500 to-teal-600",
    ring: "border-emerald-200 dark:border-emerald-900/60",
    icon: BriefcaseBusiness,
  },
];

export default function AuthChoicePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-400/15" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-teal-400/10" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:opacity-80 transition-opacity">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to home
          </Link>
          <Link to="/jobs" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Browse jobs
          </Link>
        </div>

        <section className="rounded-3xl border border-white/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-slate-200/40 dark:shadow-black/30 overflow-hidden">
          <div className="px-6 sm:px-10 lg:px-14 py-12 lg:py-16 border-b border-slate-200/70 dark:border-slate-800">
            <div className="max-w-3xl">
              {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-5">
                <LogIn className="w-4 h-4" />
                One account, two roles
              </div> */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                Sign in or create an account.
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Sign in or create an account for either applicant or recruiter access. If you need both, use the same email and move between roles without creating a second account.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className={`p-6 sm:p-8 lg:p-10 ${card.ring} ${card.title === "Applicant" ? "border-b lg:border-b-0 lg:border-r" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${card.accent} text-white flex items-center justify-center shadow-lg shadow-slate-300/30 dark:shadow-black/20`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{card.title}</h2>
                      <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">{card.summary}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid sm:grid-cols-2 gap-3">
                    <Link
                      to={card.signIn.to}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 font-semibold text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      {card.signIn.label}
                    </Link>
                    <Link
                      to={card.signUp.to}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-5 py-4 font-semibold hover:opacity-90 hover:shadow-lg transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      {card.signUp.label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}