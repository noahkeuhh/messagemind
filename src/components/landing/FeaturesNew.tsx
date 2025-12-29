import { motion } from "framer-motion";
import { Brain, Shield, TrendingUp, Clock, MessageSquare, Image, History, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Intent & Tone instantly",
    description: "Know what they really mean and how they're feeling from the first read."
  },
  {
    icon: Shield,
    title: "Emotional risk check",
    description: "See if you're walking into drama or if it's safe to engage."
  },
  {
    icon: TrendingUp,
    title: "Interest level score (0-100)",
    description: "Clear number showing how interested they are based on context and wording."
  },
  {
    icon: Clock,
    title: "Best time to reply",
    description: "Get timing recommendations so you don't respond too fast or wait too long."
  },
  {
    icon: MessageSquare,
    title: "Reply pack (multiple styles)",
    description: "Choose from casual, direct, or playful responses — ready to send."
  },
  {
    icon: Image,
    title: "Screenshot analysis",
    description: "Upload a screenshot from any app. Works on Plus and Max plans."
  },
  {
    icon: History,
    title: "History (save past analyses)",
    description: "Review old conversations and track patterns over time."
  },
  {
    icon: Lock,
    title: "Privacy controls",
    description: "Encrypted storage. Delete your data anytime. We never sell it."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#07090F" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            Everything you need
          </h2>
          <p className="text-xl" style={{ color: "#A7B1C5" }}>
            Built for clarity. No guesswork.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index % 4) * 0.1 }}
              className="p-6 rounded-xl border"
              style={{
                background: "#0D1018",
                borderColor: "#1A2233"
              }}
            >
              <feature.icon className="w-10 h-10 mb-4" style={{ color: "#5CE1E6" }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: "#E9ECF5" }}>
                {feature.title}
              </h3>
              <p className="text-sm" style={{ color: "#A7B1C5" }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
