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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="card-glass rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10"
          >
            {/* Header with gradient */}
                    <div className="relative p-8 text-center bg-gradient-to-br from-accent/10 via-transparent to-primary/10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted/20 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 border border-accent/40 flex items-center justify-center mx-auto mb-5 shadow-lg"
              >
                        <Zap className="h-10 w-10 text-accent" />
              </motion.div>

              <h2 className="text-2xl font-bold font-display text-foreground mb-3">
                Not enough credits
              </h2>
              <div className="card-elevated inline-block px-4 py-2 rounded-xl">
                <p className="text-sm text-muted-foreground">
                          You need <span className="font-bold text-accent text-lg">{creditsNeeded}</span> credits
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently available: <span className="font-semibold text-foreground">{creditsAvailable}</span>
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Quick Solutions
                </p>
                
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full justify-between group hover:scale-[1.02] transition-transform"
                  onClick={onBuyCredits}
                  data-api="/api/user/buy_pack"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white/10">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Buy Credit Pack</div>
                      <div className="text-xs opacity-90">€5 for 50 or €9.99 for 100</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between group hover:bg-accent/5 hover:border-accent/50"
                  onClick={onUpgrade}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-accent/10">
                      <AlertCircle className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Upgrade Plan</div>
                      <div className="text-xs text-muted-foreground">More daily credits</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50"></div>
                  <p>Daily credits reset at midnight</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
