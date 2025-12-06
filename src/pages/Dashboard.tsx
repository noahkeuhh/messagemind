import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisWorkspace } from "@/components/dashboard/AnalysisWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreditMeter } from "@/components/CreditMeter";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Coins } from "lucide-react";

const DashboardContent = () => {
  const [credits, setCredits] = useState({ remaining: 0, limit: 100 });

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const data = await api.getCredits();
        setCredits({
          remaining: data.credits_remaining,
          limit: data.daily_limit,
        });
      } catch (error) {
        console.error("Failed to load credits:", error);
      }
    };
    loadCredits();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-4 lg:p-6">
          {/* Credits header bar */}
          <div className="flex items-center justify-between mb-6 p-4 card-elevated">
            <div className="flex items-center gap-4">
              <CreditMeter />
              <div>
                <p className="text-sm text-muted-foreground">Credits remaining</p>
                <p className="text-xl font-bold text-foreground">
                  {credits.remaining} <span className="text-muted-foreground font-normal text-sm">/ {credits.limit}</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              data-api="/api/user/buy_pack"
            >
              <Coins className="h-4 w-4" />
              Buy credits
            </Button>
          </div>

          <AnalysisWorkspace />
        </main>
      </div>
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
