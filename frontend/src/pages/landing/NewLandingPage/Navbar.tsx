import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user?.isRecruiter ? '/company/dashboard' : '/applicant/dashboard';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Rocket size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600">
              Smart Recruit
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-slate-300 hover:text-indigo-600 font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 dark:text-slate-300 hover:text-indigo-600 font-medium transition-colors">How it Works</a>
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
                  <Link to="/applicant/login" className="text-gray-700 dark:text-slate-200 hover:text-indigo-600 font-medium transition-colors">
                    Sign In
                  </Link>
                  <Link
                    to="/applicant/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-600 dark:text-slate-200 hover:text-indigo-600 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 shadow-xl border-t border-gray-100 dark:border-slate-800 py-4"
        >
          <div className="flex flex-col px-4 gap-4">
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
    </header>
  );
};

export default Navbar;