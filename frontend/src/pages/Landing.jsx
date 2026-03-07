import React from 'react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import TechStack from '../components/landing/TechStack';
import Footer from '../components/landing/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
