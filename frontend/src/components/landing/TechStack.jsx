import React from 'react';
import { motion } from 'framer-motion';

const technologies = [
  { name: 'MERN Stack', desc: 'MongoDB, Express, React, Node.js' },
  { name: 'Flask / FastAPI', desc: 'Secure & fast Python backend' },
  { name: 'spaCy', desc: 'Industrial-strength NLP' },
  { name: 'Scikit-Learn', desc: 'Machine Learning & Ranking' },
  { name: 'JWT Auth', desc: 'Secure token-based authentication' },
  { name: 'Tailwind CSS', desc: 'Utility-first modern styling' },
];

const TechStack = () => {
  return (
    <section id="tech" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Powered by modern technology
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-600"
          >
            Built for scale, speed, and accuracy using the best tools available for full-stack and machine learning development.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {technologies.map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow group"
            >
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{tech.name}</h3>
              <p className="text-sm text-gray-500">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
