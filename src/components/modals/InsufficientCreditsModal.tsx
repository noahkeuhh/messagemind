import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Zap, ArrowRight } from "lucide-react";

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyCredits: () => void;
  onUpgrade: () => void;
  creditsNeeded?: number;
  creditsAvailable?: number;
}

export const InsufficientCreditsModal = ({
  isOpen,
  onClose,
  onBuyCredits,
  onUpgrade,
  creditsNeeded = 5,
  creditsAvailable = 0,
}: InsufficientCreditsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <h2 className="text-xl font-bold font-display text-foreground mb-2">
                Out of credits
              </h2>
              <p className="text-muted-foreground">
                You need <span className="font-semibold text-foreground">{creditsNeeded} credits</span>,
                but you only have <span className="font-semibold text-destructive">{creditsAvailable}</span>.
              </p>
            </div>

            {/* Options */}
            <div className="p-6 pt-0 space-y-3">
              <Button
                variant="hero"
                size="lg"
                className="w-full justify-between"
                onClick={onBuyCredits}
                data-api="/api/user/buy_pack"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Buy credits
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full justify-between"
                onClick={onUpgrade}
              >
                <span>Upgrade subscription</span>
                <span className="text-accent text-sm">More credits/day</span>
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Your daily credits reset at midnight.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
