import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

interface HeroProps {
  onSignupClick?: () => void;
}

export const Hero = ({ onSignupClick }: HeroProps) => {
  const scrollToExamples = () => {
    const target = document.querySelector("#examples");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-4" style={{ background: "#07090F" }}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(92, 225, 230, 0.15) 0%, transparent 70%)" }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(122, 124, 255, 0.15) 0%, transparent 70%)" }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold leading-tight" style={{ color: "#E9ECF5" }}>
              Stop second-guessing
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                every message.
              </span>
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed" style={{ color: "#A7B1C5" }}>
              Get a structured read on dating messages — intent, tone, risk level, interest score, and ready-to-send replies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={onSignupClick}
              style={{
                background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                color: "#07090F",
                padding: "0 2rem"
              }}
              className="group"
            >
              Start free monthly analysis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToExamples}
              style={{ borderColor: "#1A2233", color: "#A7B1C5" }}
              className="hover:bg-[#12151F]"
            >
              See examples
            </Button>
          </div>

          <p className="text-sm" style={{ color: "#6B7280" }}>
            No long setup. Your first result takes seconds.
          </p>
        </motion.div>

        {/* Right: Product preview card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div
            className="rounded-2xl p-6 shadow-2xl border"
            style={{ 
              background: "#0D1018",
              borderColor: "#1A2233"
            }}
          >
            {/* Message preview */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)" }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: "#6B7280" }}>Yesterday, 22:14</p>
                  <p className="mt-1" style={{ color: "#E9ECF5" }}>
                    "Yesterday was fun! We should do it again sometime 😊"
                  </p>
                </div>
              </div>

              {/* Analysis output */}
              <div className="space-y-3 pt-4 border-t" style={{ borderColor: "#1A2233" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Intent:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>Genuine follow-up</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Tone:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>Warm, casual</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Risk:</span>
                  <span className="text-sm px-2 py-1 rounded" style={{ background: "#5CE1A8", color: "#07090F" }}>Low</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Timing:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>1-2 hours</span>
                </div>

                {/* Interest bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Interest:</span>
                    <span className="text-sm font-bold" style={{ color: "#5CE1A8" }}>78/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#12151F" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #5CE1A8 0%, #5CE1E6 100%)" }}
                    />
                  </div>
                </div>

                {/* Reply suggestions */}
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Suggested replies:</p>
                  <div className="space-y-2">
                    {[
                      "Glad you had fun! How about this Friday?",
                      "Same here 😊 What days work for you?",
                      "Definitely! I'm thinking dinner this week?"
                    ].map((reply, i) => (
                      <button
                        key={i}
                        className="w-full text-left text-sm p-3 rounded-lg border hover:border-[#5CE1E6] transition-all group"
                        style={{ background: "#12151F", borderColor: "#1A2233", color: "#E9ECF5" }}
                      >
                        <Check className="inline-block w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#5CE1E6" }} />
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
