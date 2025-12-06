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
}

const creditPacks = [
  { id: "pack_50", credits: 50, price: 5, popular: false },
  { id: "pack_120", credits: 120, price: 10, popular: true, bonus: "+20 bonus" },
  { id: "pack_200", credits: 200, price: 15, popular: false },
  { id: "pack_300", credits: 300, price: 20, popular: false, bonus: "+50 bonus" },
];

export const BuyCreditsModal = ({ isOpen, onClose }: BuyCreditsModalProps) => {
  const [selectedPack, setSelectedPack] = useState<string | null>("pack_120");
  
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
    setSelectedPack("pack_120");
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-hero p-6">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Zap className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-primary-foreground">
                    Buy credits
                  </h2>
                  <p className="text-primary-foreground/70 text-sm">
                    Extra credits for more analyses
                  </p>
                </div>
              </div>
            </div>

            {/* Packs */}
            <div className="p-6 space-y-3">
              {creditPacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                    selectedPack === pack.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2 right-4 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Populair
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedPack === pack.id ? "bg-accent/10" : "bg-muted"
                      }`}>
                        <Zap className={`h-5 w-5 ${
                          selectedPack === pack.id ? "text-accent" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {pack.credits} credits
                          {pack.bonus && (
                            <span className="text-success text-sm ml-2">{pack.bonus}</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ≈ {Math.floor(pack.credits / 5)} analyses
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">€{pack.price}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Payment info */}
            <div className="px-6 pb-6">
              <div className="bg-muted rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Payment method</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-12 bg-card rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                    Visa
                  </div>
                  <div className="h-8 w-12 bg-card rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                    MC
                  </div>
                  <div className="h-8 w-12 bg-card rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                    iDEAL
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Secure payments via Stripe
                </p>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handlePurchase}
                disabled={!selectedPack || isLoading}
                data-api="/api/user/buy_pack"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Buy now — €{creditPacks.find(p => p.id === selectedPack)?.price}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
