import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisWorkspace } from "@/components/dashboard/AnalysisWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreditMeter } from "@/components/CreditMeter";
import { BuyCreditsModal } from "@/components/modals/BuyCreditsModal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Coins } from "lucide-react";

const DashboardContent = () => {
  const [credits, setCredits] = useState({ remaining: 0, limit: 100, freeAvailable: false, freeLimit: 1, freeUsed: 0 });
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'plus' | 'max' | null>(null);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const data = await api.getCredits();
        console.log('[Dashboard] Loaded credits:', data); // Debug log
        setCredits({
          remaining: data.subscription_tier === 'free'
            ? (data.free_analysis_available ? 1 : 0)
            : data.credits_remaining,
          limit: data.subscription_tier === 'free'
            ? data.monthly_free_analyses_limit ?? 1
            : data.daily_limit,
          freeAvailable: data.free_analysis_available ?? false,
          freeLimit: data.monthly_free_analyses_limit ?? 1,
          freeUsed: data.monthly_free_analyses_used ?? 0,
        });
        setSubscriptionTier(data.subscription_tier as 'free' | 'pro' | 'plus' | 'max');
        console.log('[Dashboard] Set tier to:', data.subscription_tier); // Debug log
      } catch (error) {
        console.error("[Dashboard] Failed to load credits:", error);
      }
    };
    loadCredits();
    
    // Refresh credits every 30 seconds
    const interval = setInterval(loadCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile, shown when toggle is clicked */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transform transition-transform duration-300 lg:transform-none ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:block`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Credits header bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 sm:p-6 card-elevated">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {subscriptionTier && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent uppercase">
                    {subscriptionTier}
                  </span>
                )}
                <div className="flex-1 sm:flex-initial">
                  <CreditMeter />
                </div>
              </div>
              <div>
                {subscriptionTier === 'free' ? (
                  <>
                    <p className="text-sm text-muted-foreground">Free monthly analysis</p>
                    <p className="text-xl font-bold text-foreground">
                      {credits.freeAvailable ? '1 available' : 'Used'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {credits.freeUsed}/{credits.freeLimit} used this month
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Credits remaining</p>
                    <p className="text-xl font-bold text-foreground">
                      {credits.remaining} <span className="text-muted-foreground font-normal text-sm">/ {credits.limit}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
            {subscriptionTier !== 'free' ? (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowBuyCreditsModal(true)}
              >
                <Coins className="h-4 w-4" />
                Buy credits
              </Button>
            ) : (
              <Button
                variant="hero"
                className="gap-2"
                onClick={() => window.location.href = '/pricing'}
              >
                <Coins className="h-4 w-4" />
                Upgrade
              </Button>
            )}
          </div>

          <AnalysisWorkspace />
        </main>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        currentTier={subscriptionTier}
      />
    </div>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
};

export default Dashboard;
