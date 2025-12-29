import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Zap, ArrowRight, Gift } from "lucide-react";

interface FreeTrialExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onBuyCredits: () => void;
}

export const FreeTrialExhaustedModal = ({
  isOpen,
  onClose,
  onUpgrade,
  onBuyCredits,
}: FreeTrialExhaustedModalProps) => {
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
            className="card-glass rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border-2 border-white/20"
          >
            {/* Header */}
            <div className="relative p-6 text-center bg-gradient-to-br from-primary/10 to-accent/10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-accent" />
              </div>

              <h2 className="text-xl font-bold font-display text-foreground mb-2">
                Free trial used!
              </h2>
              <p className="text-muted-foreground text-sm">
                You've used your 1 free monthly analysis. Upgrade to continue analyzing messages.
              </p>
            </div>

            {/* Features */}
            <div className="p-6 space-y-4 border-t border-border/50">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Pro: 100 credits/dag</p>
                    <p className="text-xs text-muted-foreground">€17/maand • Expanded +12, Explanation +4</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Plus: 180 credits/dag</p>
                    <p className="text-xs text-muted-foreground">€29/maand • Auto-mode Expanded included</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Max: 300 credits/dag</p>
                    <p className="text-xs text-muted-foreground">€59/maand • Auto-mode Deep included (×1.2)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-4 space-y-3 border-t border-border/50">
              <Button
                variant="hero"
                size="lg"
                className="w-full justify-between"
                onClick={onUpgrade}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Upgrade now
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-background text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full justify-between"
                onClick={onBuyCredits}
              >
                <span>Buy credits</span>
                <span className="text-accent text-sm">50 or 100 credits</span>
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Start a free trial again next month
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
