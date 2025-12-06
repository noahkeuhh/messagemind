import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditMeter } from "@/components/CreditMeter";
import { BuyCreditsModal } from "@/components/modals/BuyCreditsModal";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DashboardHeader = () => {
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
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

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Gebruiker";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Page title - dynamic based on route */}
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">
              Dashboard
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Credits */}
            <div className="hidden sm:block">
              <CreditMeter variant="default" />
            </div>

            {/* Buy credits button */}
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsBuyCreditsOpen(true)}
              className="hidden sm:flex"
            >
              <Zap className="h-4 w-4" />
              Koop credits
            </Button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
              )}
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent">{userInitial}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-foreground">{userName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Profiel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <BuyCreditsModal isOpen={isBuyCreditsOpen} onClose={() => setIsBuyCreditsOpen(false)} />
    </>
  );
};
