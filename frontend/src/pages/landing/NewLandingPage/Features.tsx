import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FileSearch, Sparkles, TrendingUp, Presentation } from 'lucide-react';

const features = [
  {
    icon: <FileSearch size={32} className="text-white" />,
    title: "AI Resume Parsing",
    description: "Instantly extract skills, experience, and education from any resume format using advanced NLP (spaCy).",
    color: "bg-blue-500",
    shadowColor: "blue",
  },
  {
    icon: <TrendingUp size={32} className="text-white" />,
    title: "Automated Ranking",
    description: "Compare candidate skills against your job requirements and get a beautifully sorted list of top matches.",
    color: "bg-indigo-500",
    shadowColor: "indigo",
  },
  {
    icon: <Sparkles size={32} className="text-white" />,
    title: "Custom AI Questions",
    description: "Generate tailored interview questions based precisely on the unique strengths and gaps in each candidate's profile.",
    color: "bg-purple-500",
    shadowColor: "purple",
  },
  {
    icon: <Presentation size={32} className="text-white" />,
    title: "Seamless Dashboard",
    description: "Manage your hiring pipeline in one beautiful, MERN-stack powered interface.",
    color: "bg-emerald-500",
    shadowColor: "emerald",
  }
];

const TiltCard = ({ feature }: { feature: any }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 dark:border-slate-700/50 group h-full cursor-pointer z-10"
    >
      <div 
        className={`${feature.color} w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-8 shadow-lg shadow-${feature.shadowColor}-500/30 relative z-20`}
        style={{ transform: "translateZ(60px)" }}
      >
        <motion.div 
          whileHover={{ rotate: 180, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          {feature.icon}
        </motion.div>
      </div>
      <h3 
        className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 tracking-tight"
        style={{ transform: "translateZ(40px)" }}
      >
        {feature.title}
      </h3>
      <p 
        className="text-gray-600 dark:text-slate-400 leading-relaxed font-light"
        style={{ transform: "translateZ(20px)" }}
      >
        {feature.description}
      </p>
      
      {/* Decorative gradient blob */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${feature.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500 blur-2xl pointer-events-none`}></div>
    </motion.div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 bg-gray-50 dark:bg-slate-950/60 transition-colors relative overflow-hidden">
      {/* Abstract Background grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTI4LCAxMjgsIDEyOCwgMC4yKSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] dark:[mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] -z-10 opacity-50"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-sm mb-6"
          >
            <Sparkles size={16} />
            <span>Turbocharge Your Workflow</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-slate-100 mb-6 tracking-tight"
          >
            Smarter hiring, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">powered by AI</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-slate-400 font-light"
          >
            We've automated the most tedious parts of recruitment so you can focus on building relationships with the best talent.
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 perspective-[1000px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {features.map((feature, index) => (
            <TiltCard key={index} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;