import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface CreditMeterProps {
  variant?: "default" | "compact" | "hero";
  showBuyButton?: boolean;
}

export const CreditMeter = ({ variant = "default", showBuyButton = true }: CreditMeterProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.getCredits(),
    refetchInterval: false, // Disable auto-refresh to prevent flickering
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Laden...</span>
      </div>
    );
  }

  const current = data?.credits_remaining || 0;
  const max = data?.daily_limit || 100;
  const percentage = (current / max) * 100;
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
      <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dagelijkse Credits</p>
              <p className="text-2xl font-bold font-display text-foreground">{current}<span className="text-muted-foreground text-lg">/{max}</span></p>
            </div>
          </div>
          {showBuyButton && (
            <button 
              className="text-accent text-sm font-semibold hover:underline"
              onClick={() => navigate("/pricing")}
            >
              Koop meer
            </button>
          )}
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isLow ? 'bg-destructive' : isMedium ? 'bg-warning' : 'bg-accent'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ≈ {Math.floor(current / 5)} analyses over vandaag
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-2 border border-border/50">
      <Zap className={`h-5 w-5 ${isLow ? 'text-destructive' : 'text-accent'}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Credits</span>
          <span className="text-sm font-semibold text-foreground">{current}/{max}</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isLow ? 'bg-destructive' : isMedium ? 'bg-warning' : 'bg-accent'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};
