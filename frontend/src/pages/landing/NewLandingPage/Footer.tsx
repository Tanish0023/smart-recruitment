import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.1 }}
      className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 py-12 transition-colors relative z-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="bg-indigo-600 text-white p-1.5 rounded-lg transition-transform"
            >
              <Rocket size={18} />
            </motion.div>
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
              Smart Recruit
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-slate-300">
            {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
              <motion.a 
                key={link}
                whileHover={{ y: -2, color: "#6366f1" }}
                href="#" 
                className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                {link}
              </motion.a>
            ))}
          </div>

          <div className="text-sm text-gray-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Smart Recruit. All rights reserved.
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;