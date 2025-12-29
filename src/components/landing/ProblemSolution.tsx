import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export const ProblemSolution = () => {
  const problems = [
    "You analyze every word, emoji, and timing yourself",
    "You ask friends who give conflicting advice",
    "You send something regrettable because you weren't sure"
  ];

  const solutions = [
    "Get a structured breakdown — no guesswork",
    "One clear answer based on context, not opinion",
    "Choose from tested replies before you hit send"
  ];

  return (
    <section id="problem-solution" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#0D1018" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            You're probably doing this
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-xl border"
            style={{
              background: "#07090F",
              borderColor: "#1A2233"
            }}
          >
            <h3 className="text-2xl font-bold mb-6" style={{ color: "#E9ECF5" }}>
              The problem
            </h3>
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#F2B27C" }} />
                  <p style={{ color: "#A7B1C5" }}>{problem}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What MessageMind Does */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-xl border relative overflow-hidden"
            style={{
              background: "#07090F",
              borderColor: "#5CE1E6"
            }}
          >
            <div 
              className="absolute inset-0 opacity-5"
              style={{ background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)" }}
            />
            <div className="relative">
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#E9ECF5" }}>
                What MessageMind does
              </h3>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#5CE1A8" }} />
                    <p style={{ color: "#E9ECF5" }}>{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
