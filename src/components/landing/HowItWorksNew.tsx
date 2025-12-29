import { motion } from "framer-motion";
import { Upload, Settings, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Paste text or upload screenshot",
    description: "Takes 5 seconds. Works with any dating app or plain text."
  },
  {
    icon: Settings,
    title: "Choose Snapshot, Expanded, or Deep",
    description: "Pick the mode based on your plan and how much detail you need."
  },
  {
    icon: MessageSquare,
    title: "Get structured breakdown + replies",
    description: "Intent, tone, risk, interest score, timing, and ready-to-send options."
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#07090F" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            How it works
          </h2>
          <p className="text-xl" style={{ color: "#A7B1C5" }}>
            Three steps. No setup.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div
                className="p-8 rounded-xl border"
                style={{
                  background: "#0D1018",
                  borderColor: "#1A2233"
                }}
              >
                {/* Step number */}
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                    color: "#07090F"
                  }}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <step.icon className="w-12 h-12 mb-4" style={{ color: "#5CE1E6" }} />

                {/* Content */}
                <h3 className="text-xl font-bold mb-3" style={{ color: "#E9ECF5" }}>
                  {step.title}
                </h3>
                <p style={{ color: "#A7B1C5" }}>
                  {step.description}
                </p>
              </div>

              {/* Connecting line (not on last item) */}
              {index < steps.length - 1 && (
                <div 
                  className="hidden md:block absolute top-16 left-full w-8 h-0.5 -translate-x-4"
                  style={{ background: "linear-gradient(90deg, #5CE1E6 0%, #7A7CFF 100%)" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-sm"
          style={{ color: "#6B7280" }}
        >
          Free plan includes 1 Snapshot analysis per month. No card required.
        </motion.p>
      </div>
    </section>
  );
};
