import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user?.isRecruiter ? '/company/dashboard' : '/applicant/dashboard';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
      setMobileMenuOpen(false); // Close menu if scrolling down
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-150%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-6xl z-50 transition-all duration-300 rounded-[2rem] border ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-gray-200/50 dark:border-slate-700/50 py-3 px-6'
          : 'bg-transparent border-transparent py-4 px-4'
      }`}
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-indigo-600 text-white p-2 rounded-xl transition-transform"
          >
            <Rocket size={24} />
          </motion.div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Smart Recruit
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <motion.a 
            whileHover={{ y: -2 }}
            href="#features" 
            className="text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          >
            Features
          </motion.a>
          <motion.a 
            whileHover={{ y: -2 }}
            href="#how-it-works" 
            className="text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          >
            How it Works
          </motion.a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className='bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:-translate-y-0.5'
              >
                Dashboard
              </Link>
            </>
          ) :(
            <>
                <Link to="/applicant/login" className="text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/applicant/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium shadow-md shadow-indigo-500/20"
                  >
                    Get Started
                  </Link>
                </motion.div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden text-gray-600 dark:text-slate-200 hover:text-indigo-600 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden absolute top-[calc(100%+10px)] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100 dark:border-slate-800"
          >
            <div className="flex flex-col px-4 gap-4 py-6">
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 dark:text-slate-300 font-medium py-2">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 dark:text-slate-300 font-medium py-2">How it Works</a>
              <hr className="border-gray-100 dark:border-slate-800" />
              <Link to="/applicant/login" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 dark:text-slate-200 font-medium py-2">Sign In</Link>
              <Link
                to="/applicant/register"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-indigo-600 text-white text-center px-4 py-3 rounded-xl font-medium"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;