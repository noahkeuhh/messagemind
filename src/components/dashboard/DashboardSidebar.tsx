import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CreditMeter } from "@/components/CreditMeter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Heart,
  Home,
  History,
  Bookmark,
  Award,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Nieuwe Analyse", href: "/dashboard" },
  { icon: History, label: "Geschiedenis", href: "/dashboard/history" },
  { icon: Bookmark, label: "Opgeslagen", href: "/dashboard/saved" },
  { icon: Award, label: "Badges", href: "/dashboard/badges" },
  { icon: CreditCard, label: "Upgrade", href: "/pricing", highlight: true },
  { icon: Settings, label: "Instellingen", href: "/dashboard/settings" },
];

export const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Get user subscription tier for display
  const { data: creditsData } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.getCredits(),
    refetchInterval: false,
    staleTime: 30000,
  });

  const subscriptionTier = creditsData?.subscription_tier || "free";
  const tierNames: Record<string, string> = {
    free: "Free Plan",
    pro: "Pro Plan",
    plus: "Plus Plan",
    max: "Max Plan",
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Gebruiker";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-sidebar h-screen sticky top-0 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold font-display text-sidebar-foreground">
              AI Flirt
            </span>
          )}
        </Link>
      </div>

      {/* Credit meter */}
      <div className={`p-4 border-b border-sidebar-border ${isCollapsed ? 'hidden' : ''}`}>
        <CreditMeter variant="compact" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : item.highlight
                  ? "text-sidebar-primary hover:bg-sidebar-accent/50"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${item.highlight ? 'text-sidebar-primary' : ''}`} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {item.highlight && !isCollapsed && (
                <Sparkles className="h-3 w-3 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar-accent rounded-full flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-primary transition-colors shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-sidebar-foreground">{userInitial}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50">{tierNames[subscriptionTier] || "Free Plan"}</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={handleSignOut}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
