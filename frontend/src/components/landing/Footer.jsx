import React from 'react';
import { Rocket } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Rocket size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Smart Recruit
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Smart Recruit. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
