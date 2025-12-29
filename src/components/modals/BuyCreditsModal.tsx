import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Zap, CreditCard, Loader2, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: "free" | "pro" | "plus" | "max";
}

const creditPacks = [
  { id: "pack_50", credits: 50, price: 5, popular: false },
  { id: "pack_100", credits: 100, price: 9.99, popular: true },
];

export const BuyCreditsModal = ({ isOpen, onClose, currentTier = "free" }: BuyCreditsModalProps) => {
  const [selectedPack, setSelectedPack] = useState<string | null>("pack_100");
  
  // Fetch available packs from API (optional - for dynamic pricing)
  // For now using static list
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePurchase = async () => {
    if (!selectedPack) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.buyPack(selectedPack);
      
      // Redirect to Stripe Checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Fout",
        description: error.message || "Kon checkout niet starten. Probeer het opnieuw.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPack("pack_100");
    setIsLoading(false);
    // Refresh credits when modal closes (in case payment was successful)
    queryClient.invalidateQueries({ queryKey: ["credits"] });
    onClose();
  };

  // Check if returning from Stripe (URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast({
        title: "Payment successful!",
        description: "Your credits have been added to your account.",
      });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("payment") === "cancelled") {
      toast({
        title: "Payment cancelled",
        description: "Your payment was cancelled.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast, queryClient]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="card-glass rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/10"
          >
            {/* Header with gradient */}
            <div className="relative p-8 text-center bg-gradient-to-br from-accent/10 via-transparent to-primary/10">
              <button
                onClick={handleClose}
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

              <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                Buy Credit Packs
              </h2>
              <p className="text-muted-foreground text-sm">
                Get extra credits for more analyses
              </p>
              {currentTier !== "free" && (
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase">
                  {currentTier === "pro" && "Pro Tier"}
                  {currentTier === "plus" && "Plus Tier ⭐"}
                  {currentTier === "max" && "Max Tier 👑"}
                </div>
              )}
            </div>

            {/* Packs */}
            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                Choose Your Pack
              </p>
              {creditPacks.map((pack, index) => (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative group ${
                    selectedPack === pack.id
                      ? "border-accent bg-accent/10 shadow-lg scale-[1.02]"
                      : "border-white/10 hover:border-accent/40 bg-muted/20 hover:bg-muted/30 hover:scale-[1.01]"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${
                        selectedPack === pack.id 
                          ? "bg-gradient-to-br from-primary/20 to-accent/15 border-accent/50" 
                          : "bg-muted/50 border-white/10 group-hover:border-accent/30"
                      }`}>
                        <Zap className={`h-7 w-7 transition-colors ${
                          selectedPack === pack.id ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">
                          {pack.credits} Credits
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ≈ {Math.floor(pack.credits / 5)} analyses
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">€{pack.price}</p>
                      <p className="text-xs text-muted-foreground">
                        €{(pack.price / pack.credits).toFixed(2)}/credit
                      </p>
                    </div>
                  </div>
                  {selectedPack === pack.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Payment info */}
            <div className="px-6 pb-6 space-y-4">
              <div className="card-elevated rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Secure Payment</p>
                    <p className="text-xs text-muted-foreground">Powered by Stripe</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 bg-card rounded-lg border border-white/10 text-xs font-medium text-foreground">
                    💳 Visa
                  </div>
                  <div className="px-3 py-1.5 bg-card rounded-lg border border-white/10 text-xs font-medium text-foreground">
                    💳 Mastercard
                  </div>
                  <div className="px-3 py-1.5 bg-card rounded-lg border border-white/10 text-xs font-medium text-foreground">
                    🏦 iDEAL
                  </div>
                  <div className="px-3 py-1.5 bg-card rounded-lg border border-white/10 text-xs font-medium text-muted-foreground">
                    +more
                  </div>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full text-base h-14 hover:scale-[1.02] transition-transform"
                onClick={handlePurchase}
                disabled={!selectedPack || isLoading}
                data-api="/api/user/buy_pack"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <span>
                      Buy {creditPacks.find(p => p.id === selectedPack)?.credits} Credits — €{creditPacks.find(p => p.id === selectedPack)?.price}
                    </span>
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-success/50"></div>
                <p>Credits added instantly after payment</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
