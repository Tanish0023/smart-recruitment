import { motion } from 'framer-motion';
import { FileSearch, Sparkles, TrendingUp, Presentation } from 'lucide-react';

const features = [
  {
    icon: <FileSearch size={32} className="text-white" />,
    title: "AI Resume Parsing",
    description: "Instantly extract skills, experience, and education from any resume format using advanced NLP (spaCy).",
    color: "bg-blue-500",
    delay: 0.1
  },
  {
    icon: <TrendingUp size={32} className="text-white" />,
    title: "Automated Ranking",
    description: "Compare candidate skills against your job requirements and get a beautifully sorted list of top matches.",
    color: "bg-indigo-500",
    delay: 0.2
  },
  {
    icon: <Sparkles size={32} className="text-white" />,
    title: "Custom AI Questions",
    description: "Generate tailored interview questions based precisely on the unique strengths and gaps in each candidate's profile.",
    color: "bg-purple-500",
    delay: 0.3
  },
  {
    icon: <Presentation size={32} className="text-white" />,
    title: "Seamless Dashboard",
    description: "Manage your hiring pipeline in one beautiful, MERN-stack powered interface.",
    color: "bg-emerald-500",
    delay: 0.4
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6"
          >
            Smarter hiring, <span className="text-indigo-600">powered by AI</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            We've automated the most tedious parts of recruitment so you can focus on building relationships with the best talent.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group"
            >
              <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;