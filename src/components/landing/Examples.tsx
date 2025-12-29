import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Check } from "lucide-react";

const examples = [
  {
    message: "Not sure if I'm free tonight… might have plans",
    intent: "Testing your reaction",
    tone: "Uncertain, lukewarm",
    risk: "Medium",
    riskColor: "#F2B27C",
    timing: "4-6 hours or next day",
    interest: 42,
    replies: [
      "No worries! Let me know if it works out.",
      "Sounds good. Just shoot me a text if you're free.",
      "Cool, I've got backup plans anyway 😊"
    ]
  },
  {
    message: "Yesterday was fun! We should do it again sometime 😊",
    intent: "Genuine follow-up",
    tone: "Warm, casual",
    risk: "Low",
    riskColor: "#5CE1A8",
    timing: "1-2 hours",
    interest: 78,
    replies: [
      "Glad you had fun! How about this Friday?",
      "Same here 😊 What days work for you?",
      "Definitely! I'm thinking dinner this week?"
    ]
  },
  {
    message: "I think we're looking for different things…",
    intent: "Soft rejection",
    tone: "Polite, distant",
    risk: "High",
    riskColor: "#E74C3C",
    timing: "Leave it or reply briefly",
    interest: 18,
    replies: [
      "I appreciate you being honest. Take care.",
      "Fair enough. Thanks for letting me know.",
      "No hard feelings. Good luck out there!"
    ]
  }
];

interface ExamplesProps {
  onSignupClick?: () => void;
}

export const Examples = ({ onSignupClick }: ExamplesProps) => {
  return (
    <section id="examples" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#0D1018" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            See it in action
          </h2>
          <p className="text-xl" style={{ color: "#A7B1C5" }}>
            Real messages. Real analysis.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {examples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-xl border overflow-hidden"
              style={{
                background: "#07090F",
                borderColor: "#1A2233"
              }}
            >
              {/* Message */}
              <div className="p-6 border-b" style={{ borderColor: "#1A2233" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)" }} />
                  <p style={{ color: "#E9ECF5" }}>
                    {example.message}
                  </p>
                </div>
              </div>

              {/* Analysis */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Intent:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>{example.intent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Tone:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>{example.tone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Risk:</span>
                  <span 
                    className="text-sm px-2 py-1 rounded font-medium"
                    style={{ background: example.riskColor, color: "#07090F" }}
                  >
                    {example.risk}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Timing:</span>
                  <span className="text-sm" style={{ color: "#E9ECF5" }}>{example.timing}</span>
                </div>

                {/* Interest bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Interest:</span>
                    <span className="text-sm font-bold" style={{ color: example.interest > 50 ? "#5CE1A8" : "#F2B27C" }}>
                      {example.interest}/100
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#12151F" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${example.interest}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ 
                        background: example.interest > 50 
                          ? "linear-gradient(90deg, #5CE1A8 0%, #5CE1E6 100%)"
                          : "linear-gradient(90deg, #F2B27C 0%, #E74C3C 100%)"
                      }}
                    />
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-2 pt-4 border-t" style={{ borderColor: "#1A2233" }}>
                  <p className="text-sm font-medium" style={{ color: "#A7B1C5" }}>Reply options:</p>
                  {example.replies.map((reply, i) => (
                    <div 
                      key={i}
                      className="text-sm p-2 rounded border"
                      style={{ background: "#12151F", borderColor: "#1A2233", color: "#E9ECF5" }}
                    >
                      {reply}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="p-6 pt-0">
                <Button
                  className="w-full"
                  onClick={onSignupClick}
                  style={{
                    background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                    color: "#07090F"
                  }}
                >
                  Try it free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
