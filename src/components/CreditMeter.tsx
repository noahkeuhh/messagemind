import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BuyCreditsModal } from "@/components/modals/BuyCreditsModal";

interface CreditMeterProps {
  variant?: "default" | "compact" | "hero";
  showBuyButton?: boolean;
}

export const CreditMeter = ({ variant = "default", showBuyButton = true }: CreditMeterProps) => {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.getCredits(),
    refetchInterval: 5000, // Refresh every 5 seconds to keep live
    staleTime: 1000, // Consider data stale after 1 second
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Laden...</span>
      </div>
    );
  }

  const tier = data?.subscription_tier || 'free';
  const isFree = tier === 'free';
  const freeAvailable = data?.free_analysis_available ?? (isFree ? (data?.credits_remaining ?? 0) > 0 : false);
  const max = isFree ? (data?.monthly_free_analyses_limit ?? 1) : (data?.daily_limit || 100);
  const current = isFree ? (freeAvailable ? 1 : 0) : (data?.credits_remaining || 0);
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isLow = percentage < 20;
  const isMedium = percentage >= 20 && percentage < 50;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Zap className={`h-4 w-4 ${isLow ? 'text-destructive' : 'text-accent'}`} />
        <span className="text-sm font-medium text-foreground">
          {current}/{max}
        </span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <>
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/30">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isFree ? 'Maandelijkse Analyse' : 'Dagelijkse Credits'}
                </p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {isFree ? (current > 0 ? current : 0) : current}
                  <span className="text-muted-foreground text-lg">/{isFree ? max : max}</span>
                </p>
              </div>
            </div>
            {showBuyButton && (
              <button 
                className="text-accent text-sm font-semibold hover:underline"
                onClick={() => isFree ? window.location.href = "/pricing" : setShowBuyModal(true)}
              >
                {isFree ? 'Upgrade' : 'Koop meer'}
              </button>
            )}
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isLow ? 'bg-destructive' : isMedium ? 'bg-warning' : 'bg-gradient-to-r from-primary to-accent'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={!isLow && !isMedium ? { boxShadow: '0 0 10px hsl(var(--accent) / 0.5)' } : {}}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isFree 
              ? 'Gratis snapshot analyse per maand' 
              : `≈ ${Math.floor(current / 5)} analyses over vandaag`
            }
          </p>
        </div>
        
        <BuyCreditsModal 
          isOpen={showBuyModal} 
          onClose={() => setShowBuyModal(false)} 
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 card-glass rounded-lg px-4 py-2">
        <Zap className={`h-5 w-5 ${isLow ? 'text-destructive' : 'text-accent'}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="text-sm font-semibold text-foreground">{current}/{max}</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isLow ? 'bg-destructive' : isMedium ? 'bg-warning' : 'bg-gradient-to-r from-primary to-accent'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={!isLow && !isMedium ? { boxShadow: '0 0 8px hsl(var(--accent) / 0.5)' } : {}}
            />
          </div>
        </div>
      </div>
      
      <BuyCreditsModal 
        isOpen={showBuyModal} 
        onClose={() => setShowBuyModal(false)} 
      />
    </>
  );
};
