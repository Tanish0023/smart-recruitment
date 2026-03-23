import { motion } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "Post a Job",
    description: "Create a job listing with specific skills and requirements."
  },
  {
    number: "02",
    title: "Upload Resumes",
    description: "Candidates apply, or you batch-upload resumes."
  },
  {
    number: "03",
    title: "AI Analysis",
    description: "Our NLP engine extracts skills and compares them to the job."
  },
  {
    number: "04",
    title: "Hire Top Talent",
    description: "Review the ranked list and use AI-generated interview questions."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                How it works
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-300 mb-10">
                A seamless pipeline from job posting to the final interview. Our MERN-stack platform integrates a powerful Python backend to handle heavy language processing.
              </p>

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{step.title}</h3>
                      <p className="text-gray-600 dark:text-slate-300">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Abstract visual representation of dashboard */}
            <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-indigo-100/50 dark:border-slate-700 shadow-2xl relative">
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="h-8 bg-white dark:bg-slate-800 rounded flex items-center px-4 w-1/3 shadow-sm">
                   <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-full"></div>
                </div>

                {[98, 92, 85, 78].map((score, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-sm">
                        C{i+1}
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-emerald-600">{score}% Match</span>
                      <div className="w-20 h-2 bg-gray-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${score}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;