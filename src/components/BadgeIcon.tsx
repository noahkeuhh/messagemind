import { 
  Sparkles, 
  Target, 
  Crosshair, 
  Trophy, 
  Flame, 
  Zap,
  Sun,
  Layers,
  Book,
  Eye,
  Heart,
  AlertCircle,
  Star,
  Crown,
  ImageIcon
} from "lucide-react";

interface BadgeIconProps {
  icon: string;
  className?: string;
}

export const BadgeIcon = ({ icon, className = "h-6 w-6" }: BadgeIconProps) => {
  const iconMap: Record<string, any> = {
    spark: Sparkles,
    image: ImageIcon,
    zap: Zap,
    target: Target,
    crosshair: Crosshair,
    trophy: Trophy,
    flame: Flame,
    fire: Flame,
    sun: Sun,
    layers: Layers,
    book: Book,
    eye: Eye,
    heart: Heart,
    alert: AlertCircle,
    star: Star,
    sparkles: Sparkles,
    crown: Crown,
  };

  const Icon = iconMap[icon] || Sparkles;

  return <Icon className={className} />;
};
