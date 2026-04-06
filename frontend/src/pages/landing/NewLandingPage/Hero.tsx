import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const MagneticButton = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    ref.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  }
  
  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = `translate(0px, 0px)`;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: 'transform 0.1s ease-out' }}
    >
      {children}
    </motion.div>
  )
}

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {/* Background Floating Elements */}
      <motion.div style={{ y: yBackground }} className="absolute inset-0 -z-10 pointer-events-none">
        {/* Animated glowing orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-indigo-500/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 -left-20 w-[24rem] h-[24rem] rounded-full bg-purple-500/20 blur-[100px]"
        />
        
        {/* Floating AI Data Nodes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: Math.random() * 100, x: Math.random() * 100, opacity: 0 }}
            animate={{ 
              y: [Math.random() * 100, Math.random() * -100, Math.random() * 100],
              x: [Math.random() * 100, Math.random() * -100, Math.random() * 100],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 dark:bg-slate-800/30 backdrop-blur-md border border-white/10 dark:border-slate-700/50 shadow-xl"
            style={{ 
              top: `${20 + Math.random() * 60}%`, 
              left: `${10 + Math.random() * 80}%` 
            }}
          >
             <BrainCircuit size={20} className="text-indigo-600/50 dark:text-indigo-400/50" />
          </motion.div>
        ))}
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 backdrop-blur-md border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 font-medium text-sm mb-8 shadow-sm"
          >
            <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400" />
            <span>AI-Powered Recruitment for Startups</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl lg:text-7xl dark:text-white font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]"
          >
            Hire the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400" style={{ backgroundSize: '200% auto', animation: 'gradient 3s linear infinite' }}>perfect candidate</span> faster with AI
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Automate your hiring process. Extract skills, rank applicants instantly, and generate customized interview questions tailored to each candidate's resume.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <MagneticButton>
              <Link
                to="/company/login"
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Post a Job Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </MagneticButton>
            
            <MagneticButton>
              <Link
                to="/jobs"
                className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 shadow-lg shadow-gray-200/20 dark:shadow-slate-900/50 rounded-full font-semibold text-lg transition-all"
              >
                Find Jobs
              </Link>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
};

export default Hero;