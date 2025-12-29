import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FinalCTAProps {
  onSignupClick?: () => void;
}

export const FinalCTA = ({ onSignupClick }: FinalCTAProps) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#0D1018" }}>
      <div className="container max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color: "#E9ECF5" }}>
            Get clarity before you hit send
          </h2>
          
          <p className="text-xl leading-relaxed" style={{ color: "#A7B1C5" }}>
            Stop wondering what they meant. Stop asking friends who give conflicting advice.
            Get a structured breakdown in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onSignupClick}
              style={{
                background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                color: "#07090F",
                padding: "0 2.5rem"
              }}
              className="group"
            >
              Start free monthly analysis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-sm" style={{ color: "#6B7280" }}>
            No long setup. Your first result takes seconds.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
