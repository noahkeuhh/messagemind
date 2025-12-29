import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Lock, Award, Sparkles, 
  Target, Flame, Layers, Eye, Crown,
  TrendingUp, Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgeCard from "@/components/BadgeCard";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Badge {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  required_tier: string | null;
  reward_credits: number;
}

const BadgesContent = () => {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      try {
        const response = await api.getBadges();
        return response;
      } catch (err) {
        console.error('Badges fetch error:', err);
        throw err;
      }
    },
    retry: false,
    enabled: !!user,
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      usage: Target,
      streak: Flame,
      mode: Layers,
      skill: Eye,
      plan: Crown,
    };
    return icons[category] || Trophy;
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      usage: "Gebruik",
      streak: "Streaks",
      mode: "Modi",
      skill: "Vaardigheid",
      plan: "Abonnement",
    };
    return names[category] || category;
  };

  const groupByCategory = (badges: Badge[]) => {
    const grouped: Record<string, Badge[]> = {};
    for (const badge of badges) {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    }
    return grouped;
  };

  const unlocked = data?.unlocked || [];
  const locked = data?.locked || [];
  const allBadges = [...unlocked, ...locked];

  const groupedAll = groupByCategory(allBadges);
  const groupedUnlocked = groupByCategory(unlocked);
  const groupedLocked = groupByCategory(locked);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Badges laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Badge error details:', error);
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-foreground mb-2">Kan badges niet laden</h3>
          <p className="text-muted-foreground mb-4">
            Er is een probleem bij het ophalen van badges.
          </p>
          <p className="text-sm text-muted-foreground/70 font-mono">
            {error?.message || 'Onbekende fout'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Probeer opnieuw
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <main className="mx-auto max-w-5xl">
          <AnimatePresence>
            {user ? (
              <motion.div
                key="badges-page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-bold font-display text-foreground">Badges</h1>
                  <p className="text-muted-foreground">Verdien badges door analyses te voltooien</p>
                </div>

                {/* Progress Summary */}
                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold font-display text-foreground">
                          {unlocked.length} / {allBadges.length}
                        </h2>
                        <p className="text-sm text-muted-foreground">Badges ontgrendeld</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-accent">
                        {allBadges.length > 0 ? Math.round((unlocked.length / allBadges.length) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Voltooid</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="all">
                      Alle badges ({allBadges.length})
                    </TabsTrigger>
                    <TabsTrigger value="unlocked">
                      Ontgrendeld ({unlocked.length})
                    </TabsTrigger>
                    <TabsTrigger value="locked">
                      Vergrendeld ({locked.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* All Badges Tab */}
                  <TabsContent value="all" className="space-y-8">
                    {Object.entries(groupedAll).map(([category, badges]) => {
                      const CategoryIcon = getCategoryIcon(category);
                      return (
                        <div key={category}>
                          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                            <CategoryIcon className="h-5 w-5 text-accent" />
                            {getCategoryName(category)}
                          </h2>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {badges.map((badge) => {
                              const isUnlocked = unlocked.some((u) => u.id === badge.id);
                              const unlockedBadge = unlocked.find((u) => u.id === badge.id);
                              return (
                                <BadgeCard
                                  key={badge.id}
                                  badge={badge}
                                  unlocked={isUnlocked}
                                  unlockedAt={unlockedBadge?.unlocked_at}
                                  size="md"
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* Unlocked Badges Tab */}
                  <TabsContent value="unlocked" className="space-y-8">
                    {Object.keys(groupedUnlocked).length === 0 ? (
                      <div className="card-elevated p-12 text-center">
                        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-bold text-foreground mb-2">Nog geen badges ontgrendeld</h3>
                        <p className="text-muted-foreground mb-6">
                          Voltooi je eerste analyse om je eerste badge te verdienen!
                        </p>
                        <Button asChild>
                          <a href="/dashboard">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Start analyse
                          </a>
                        </Button>
                      </div>
                    ) : (
                      Object.entries(groupedUnlocked).map(([category, badges]) => {
                        const CategoryIcon = getCategoryIcon(category);
                        return (
                          <div key={category}>
                            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                              <CategoryIcon className="h-5 w-5 text-accent" />
                              {getCategoryName(category)}
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {badges.map((badge) => {
                                const unlockedBadge = badge as Badge & { unlocked_at: string };
                                return (
                                  <BadgeCard
                                    key={badge.id}
                                    badge={badge}
                                    unlocked={true}
                                    unlockedAt={unlockedBadge.unlocked_at}
                                    size="md"
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  {/* Locked Badges Tab */}
                  <TabsContent value="locked" className="space-y-8">
                    {Object.keys(groupedLocked).length === 0 ? (
                      <div className="card-elevated p-12 text-center">
                        <Trophy className="h-12 w-12 text-accent mx-auto mb-4" />
                        <h3 className="font-bold text-foreground mb-2">Alle badges ontgrendeld! 🎉</h3>
                        <p className="text-muted-foreground">
                          Geweldig werk! Je hebt alle beschikbare badges verdiend.
                        </p>
                      </div>
                    ) : (
                      Object.entries(groupedLocked).map(([category, badges]) => {
                        const CategoryIcon = getCategoryIcon(category);
                        return (
                          <div key={category}>
                            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                              {getCategoryName(category)}
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {badges.map((badge) => (
                                <BadgeCard
                                  key={badge.id}
                                  badge={badge}
                                  unlocked={false}
                                  size="md"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const Badges = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <BadgesContent />
    </ProtectedRoute>
  );
};

export default Badges;
