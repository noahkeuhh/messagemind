import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Zap,
  ChevronDown,
  Settings,
  CreditCard,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasNotifications] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-30 text-sidebar-foreground">
        <div className="flex items-center justify-between h-[61px] px-4 sm:px-6">
          {/* Left section with menu button and title */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors"
            >
              <Menu className="h-5 w-5 text-sidebar-foreground" />
            </button>
            
            <h1 className="text-lg sm:text-xl font-bold font-display text-sidebar-foreground">
              Dashboard
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Upgrade button */}
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate("/pricing")}
              className="gap-1 sm:gap-2 font-semibold text-xs sm:text-sm px-2 sm:px-4"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </Button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-sidebar-foreground/80" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sidebar-primary rounded-full" />
              )}
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-sidebar-accent/60 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-sidebar-foreground">{userInitial}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/70 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-sidebar-foreground">{userName}</p>
                  <p className="text-sm text-sidebar-foreground/70">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
};
