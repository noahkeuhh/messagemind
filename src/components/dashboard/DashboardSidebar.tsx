import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  MessageCircle,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "New Analysis", href: "/dashboard" },
  { icon: History, label: "History", href: "/dashboard/history", requiresPaid: true },
  { icon: Bookmark, label: "Saved", href: "/dashboard/saved" },
  { icon: Award, label: "Badges", href: "/dashboard/badges" },
  { icon: CreditCard, label: "Upgrade", href: "/pricing", highlight: true },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
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
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const subscriptionTier = creditsData?.subscription_tier || "free";
  const tierNames: Record<string, string> = {
    free: "Free Plan",
    pro: "Pro Plan",
    plus: "Plus Plan",
    max: "Max Plan",
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
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
        isCollapsed ? "w-16 sm:w-20" : "w-56 sm:w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-[62px] px-4 flex items-center border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="h-7 w-7" style={{ color: "hsl(180 85% 65%)" }} />
            <motion.div
              className="absolute inset-0 blur-lg"
              style={{ background: "linear-gradient(135deg, hsl(180 85% 65%) 0%, hsl(248 73% 70%) 100%)", opacity: 0.3 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          {!isCollapsed && (
            <span 
              className="font-bold font-display text-lg"
              style={{ 
                background: "linear-gradient(135deg, hsl(180 85% 65%) 0%, hsl(248 73% 70%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              MessageMind
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isDisabled = item.requiresPaid && subscriptionTier === 'free';
          
          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
                title="Upgrade to access History"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
            );
          }
          
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
