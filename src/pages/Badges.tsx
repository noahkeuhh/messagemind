import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Award,
  Flame,
  Target,
  Zap,
  Crown,
  MessageSquare,
  Calendar,
  Share2,
  Lock,
} from "lucide-react";

const badges = [
  {
    id: "first_analysis",
    name: "Eerste Stap",
    description: "Voltooi je eerste analyse",
    icon: Target,
    earned: true,
    earnedAt: "2 dagen geleden",
  },
  {
    id: "streak_3",
    name: "3-Daagse Streak",
    description: "Analyseer 3 dagen achter elkaar",
    icon: Flame,
    earned: true,
    earnedAt: "Gisteren",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7 dagen achter elkaar actief",
    icon: Flame,
    earned: false,
    progress: 3,
    total: 7,
  },
  {
    id: "analyses_10",
    name: "Analyse Expert",
    description: "Voltooi 10 analyses",
    icon: MessageSquare,
    earned: true,
    earnedAt: "Vandaag",
  },
  {
    id: "analyses_50",
    name: "Chat Master",
    description: "Voltooi 50 analyses",
    icon: Crown,
    earned: false,
    progress: 12,
    total: 50,
  },
  {
    id: "perfect_score",
    name: "Perfect Match",
    description: "Krijg een 95+ interesse score",
    icon: Zap,
    earned: false,
    locked: true,
  },
];

const streakDays = [
  { day: "Ma", active: true },
  { day: "Di", active: true },
  { day: "Wo", active: true },
  { day: "Do", active: false, today: true },
  { day: "Vr", active: false },
  { day: "Za", active: false },
  { day: "Zo", active: false },
];

const BadgesContent = () => {
  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Badges & Streaks</h1>
              <p className="text-muted-foreground">Verdien badges en houd je streak bij</p>
            </div>

            {/* Streak tracker */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">3 dagen streak!</h2>
                    <p className="text-sm text-muted-foreground">Nog 4 dagen tot Week Warrior badge</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Deel
                </Button>
              </div>

              <div className="flex justify-between">
                {streakDays.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      day.active ? 'bg-accent text-accent-foreground' :
                      day.today ? 'border-2 border-accent border-dashed' :
                      'bg-muted'
                    }`}>
                      {day.active && <Flame className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs ${day.today ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earned badges */}
            <div>
              <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Verdiende badges ({earnedBadges.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elevated p-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-3">
                        <badge.icon className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="font-bold text-foreground">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                      <span className="text-xs text-success">✓ Verdiend {badge.earnedAt}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Unearned badges */}
            <div>
              <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Te verdienen ({unearnedBadges.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unearnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`card-elevated p-5 ${badge.locked ? 'opacity-50' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                      {badge.locked ? (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <badge.icon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-bold text-foreground">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                    
                    {badge.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Voortgang</span>
                          <span>{badge.progress}/{badge.total}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {badge.locked && (
                      <span className="text-xs text-muted-foreground">Binnenkort beschikbaar</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
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
