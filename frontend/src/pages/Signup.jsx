import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';

const Signup = () => {
  return (
    <div className="min-h-screen flex bg-white selection:bg-indigo-500 selection:text-white">
      {/* Left Panel - Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-50 relative overflow-hidden items-center justify-center p-12 order-2 lg:order-1">
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="relative z-10 max-w-lg text-center bg-white/60 backdrop-blur-xl p-12 rounded-3xl border border-white/40 shadow-xl"
        >
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-2xl font-bold text-indigo-600 mb-1">50+</div>
               <div className="text-sm font-medium text-gray-600">Free Resumes</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-2xl font-bold text-indigo-600 mb-1">98%</div>
               <div className="text-sm font-medium text-gray-600">Match Accuracy</div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-2xl font-bold text-indigo-600 mb-1">~5 mins</div>
               <div className="text-sm font-medium text-gray-600">Setup Time</div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-2xl font-bold text-indigo-600 mb-1">∞</div>
               <div className="text-sm font-medium text-gray-600">AI Questions</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start hiring smarter</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Create an account to start posting jobs and automatically ranking applicants using intelligent parsing.
          </p>
        </motion.div>
      </div>
      
      {/* Right Panel - Form (Left on Mobile) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 order-1 lg:order-2 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          <Link to="/" className="flex items-center gap-2 group mb-10">
            <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Rocket size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Smart Recruit
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
          <p className="text-gray-600 mb-8">Let's get your company set up.</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
                    placeholder="Jane"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  type="text"
                  className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
                  placeholder="Appleseed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Briefcase size={18} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
                  placeholder="jane@acmecorp.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
                  placeholder="Create a strong password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters.</p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mt-6"
            >
              Get started
              <ArrowRight size={18} />
            </button>
          </form>
          
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          
          <div className="mt-6">
             <button className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign up with Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
