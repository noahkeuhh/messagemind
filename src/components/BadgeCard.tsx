import { motion } from "framer-motion";
import { BadgeIcon } from "./BadgeIcon";
import { Lock } from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  required_tier?: string;
  unlocked_at?: string;
}

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
}

export const BadgeCard = ({ badge, unlocked, size = "md" }: BadgeCardProps) => {
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-24 h-28",
    lg: "w-32 h-36",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      usage: "from-blue-500/20 to-blue-600/10",
      streak: "from-orange-500/20 to-red-600/10",
      mode: "from-purple-500/20 to-pink-600/10",
      skill: "from-green-500/20 to-emerald-600/10",
      plan: "from-accent/20 to-primary/10",
    };
    return colors[category] || "from-muted/20 to-muted/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={unlocked ? { scale: 1.05 } : {}}
      className={`${sizeClasses[size]} relative`}
    >
      <div
        className={`h-full rounded-2xl border transition-all ${
          unlocked
            ? `border-white/20 bg-gradient-to-br ${getCategoryColor(badge.category)} shadow-lg`
            : "border-white/5 bg-muted/10 grayscale opacity-40"
        }`}
        title={badge.description}
      >
        <div className="flex flex-col items-center justify-center h-full p-3 relative">
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl backdrop-blur-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div
            className={`rounded-xl p-2 mb-2 ${
              unlocked
                ? `bg-gradient-to-br ${getCategoryColor(badge.category)}`
                : "bg-muted/20"
            }`}
          >
            <BadgeIcon
              icon={badge.icon}
              className={`${iconSizes[size]} ${
                unlocked ? "text-foreground" : "text-muted-foreground"
              }`}
            />
          </div>
          <p
            className={`text-xs font-semibold text-center ${
              unlocked ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {badge.name}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeCard;
