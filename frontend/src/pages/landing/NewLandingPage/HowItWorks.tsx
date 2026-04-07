import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

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
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start", "end"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Custom spring for smoother line fill
  const springLineHeight = useSpring(lineHeight, { stiffness: 100, damping: 20 });

  return (
    <section id="how-it-works" ref={containerRef} className="py-32 bg-white dark:bg-slate-950 overflow-hidden transition-colors relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-20">

          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-slate-100 mb-6 tracking-tight">
                How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">works</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-12 font-light">
                A seamless pipeline from job posting to the final interview. Our MERN-stack platform integrates a powerful Python backend to handle heavy language processing.
              </p>

              <div className="relative pl-4">
                {/* Scroll-filling progress line */}
                <div className="absolute left-9 top-4 bottom-4 w-1 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                <motion.div
                  className="absolute left-9 top-4 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-full origin-top"
                  style={{ height: springLineHeight }}
                ></motion.div>

                <div className="space-y-12">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="flex gap-8 relative z-10"
                    >
                      <div className="shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border-4 border-white dark:border-slate-950 shadow-md transition-shadow"
                        >
                          {step.number}
                        </motion.div>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all w-full">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">{step.title}</h3>
                        <p className="text-gray-600 dark:text-slate-400 font-light">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:w-1/2 relative w-full h-[600px] perspective-[1000px]">
            <motion.div
              style={{ rotateY: -10, rotateX: 5 }}
              initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: -10 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
              className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-[#0f172a] rounded-[2rem] p-8 border border-slate-700/50 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>

              {/* Animated scanning bar */}
              <motion.div
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent pointer-events-none z-20"
              />

              <div className="mt-12 space-y-4">
                <div className="h-10 bg-slate-800/80 rounded-lg flex items-center px-4 w-1/2 mb-8 shadow-inner border border-slate-700/50">
                   <div className="h-2 bg-slate-600 rounded w-full"></div>
                </div>

                {[
                  { score: 98, name: "Alice J." },
                  { score: 92, name: "Marcus L." },
                  { score: 85, name: "Sarah K." },
                  { score: 78, name: "David O." }
                ].map((candidate, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    viewport={{ once: true }}
                    className="bg-slate-800/60 p-4 rounded-xl flex items-center justify-between border border-slate-700/30 hover:border-emerald-500/30 transition-colors relative overflow-hidden group"
                  >
                    {/* Hover highlight */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-slate-600">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-200 font-medium">{candidate.name}</div>
                        <div className="text-slate-400 text-sm">Full Stack Engineer</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end relative z-10">
                      <span className="text-sm font-bold text-emerald-400">{candidate.score}% Match</span>
                      <div className="w-24 h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${candidate.score}%` }}
                          transition={{ duration: 1.5, delay: 1 + i * 0.2, ease: "easeOut" }}
                          className="h-full bg-emerald-500 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Background glowing blurred blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;