import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  MessageSquare,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import { AnalysisDetailModal } from "@/components/modals/AnalysisDetailModal";

const HistoryContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["history", page, limit],
    queryFn: () => api.getHistory(limit, page * limit),
    refetchInterval: false, // Disable auto-refresh to prevent flickering
    staleTime: 60000, // Consider data fresh for 60 seconds
  });

  const analyses = data?.analyses || [];

  const filteredHistory = analyses.filter((item) => {
    const matchesSearch = item.input_text?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getIntentLabel = (result: any) => {
    if (!result) return "Onbekend";
    // Support both old and new format
    if (result.intent) return result.intent;
    if (result.intentLabel === "positive") return "Positief";
    if (result.intentLabel === "negative") return "Negatief";
    return "Neutraal";
  };

  const getScore = (result: any) => {
    if (!result) return null;
    // Support both old and new format
    if (result.emotional_risk) {
      return result.emotional_risk === "low" ? "Laag" :
             result.emotional_risk === "high" ? "Hoog" : "Medium";
    }
    return result.toneScore || result.interestLevel || null;
  };

  const getProviderBadge = (provider: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      cohere: { label: "Cohere", color: "bg-blue-500/10 text-blue-500" },
      openai: { label: "GPT-4", color: "bg-green-500/10 text-green-500" },
      claude: { label: "Claude", color: "bg-purple-500/10 text-purple-500" },
    };
    return badges[provider] || { label: provider, color: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">Geschiedenis</h1>
                <p className="text-muted-foreground">Bekijk al je eerdere analyses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoeken..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="done">Voltooid</SelectItem>
                    <SelectItem value="processing">Verwerken</SelectItem>
                    <SelectItem value="failed">Mislukt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* History list */}
            {isLoading ? (
              <div className="card-elevated p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Geschiedenis laden...</p>
              </div>
            ) : error ? (
              <div className="card-elevated p-12 text-center">
                <p className="text-destructive">Fout bij laden van geschiedenis</p>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((item, index) => {
                  const result = item.analysis_result;
                  const score = getScore(result);
                  const intent = getIntentLabel(result);
                  const providerBadge = getProviderBadge(item.provider_used || "unknown");
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="card-elevated p-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-5 w-5 text-accent" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">
                            "{item.input_text?.substring(0, 60) || "Geen tekst"}..."
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              score >= 70 ? 'bg-success/10 text-success' :
                              score >= 50 ? 'bg-warning/10 text-warning' :
                              'bg-destructive/10 text-destructive'
                            }`}>
                              {intent} • {score}/100
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${providerBadge.color}`}>
                              {providerBadge.label}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: nl })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.credits_used} credits
                            </span>
                            {item.status === "processing" && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Verwerken...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.status === "done" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedAnalysisId(item.id);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Geen analyses gevonden
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterStatus !== "all" 
                    ? "Probeer een andere zoekterm of filter."
                    : "Je hebt nog geen analyses uitgevoerd. Start je eerste analyse!"}
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Analysis Detail Modal */}
      {selectedAnalysisId && (
        <AnalysisDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAnalysisId(null);
          }}
          analysisId={selectedAnalysisId}
        />
      )}
    </div>
  );
};

const History = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <HistoryContent />
    </ProtectedRoute>
  );
};

export default History;
