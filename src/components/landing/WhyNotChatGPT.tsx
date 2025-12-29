import { motion } from "framer-motion";
import { Target, Clock, History, Shield } from "lucide-react";

const reasons = [
  {
    icon: Target,
    title: "Structured layout",
    description: "Intent, tone, risk, timing, interest score — not a wall of text."
  },
  {
    icon: Clock,
    title: "Designed for dating messages",
    description: "Trained on real chat scenarios, not generic business emails."
  },
  {
    icon: History,
    title: "Fast one-paste workflow",
    description: "No need to explain context or write custom prompts."
  },
  {
    icon: Shield,
    title: "Tracks credits and history",
    description: "See past analyses, manage your plan, delete whenever."
  }
];

export const WhyNotChatGPT = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#0D1018" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            Why not just use ChatGPT?
          </h2>
          <p className="text-xl" style={{ color: "#A7B1C5" }}>
            You could. But MessageMind is purpose-built.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 rounded-xl border"
              style={{
                background: "#07090F",
                borderColor: "#1A2233"
              }}
            >
              <reason.icon className="w-10 h-10 mb-4" style={{ color: "#5CE1E6" }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: "#E9ECF5" }}>
                {reason.title}
              </h3>
              <p className="text-sm" style={{ color: "#A7B1C5" }}>
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
