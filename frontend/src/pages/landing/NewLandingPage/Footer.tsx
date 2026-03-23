import { Rocket } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 py-12 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Rocket size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
              Smart Recruit
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-slate-300">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">Contact</a>
          </div>

          <div className="text-sm text-gray-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Smart Recruit. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;