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
    // Handle both object and string formats
    if (typeof result === 'object') {
      return result.intent || result.intentLabel || "Onbekend";
    }
    return "Onbekend";
  };

  const getToneLabel = (result: any) => {
    if (!result) return "Neutraal";
    if (typeof result === 'object') {
      return result.tone || "Neutraal";
    }
    return "Neutraal";
  };

  const getInterestLevel = (result: any) => {
    if (!result) return 0;
    if (typeof result === 'object') {
      const level = result.interestLevel || result.interest_level || 0;
      return typeof level === 'string' ? parseInt(level) : level;
    }
    return 0;
  };

  const getEmotionalRisk = (result: any) => {
    if (!result) return "low";
    if (typeof result === 'object') {
      return result.emotional_risk || "low";
    }
    return "low";
  };

  const getRiskBadge = (risk: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: "Laag risico", color: "bg-success/10 text-success" },
      medium: { label: "Medium risico", color: "bg-warning/10 text-warning" },
      high: { label: "Hoog risico", color: "bg-destructive/10 text-destructive" },
    };
    return badges[risk] || badges.low;
  };

  const getProviderBadge = (provider: string) => {
    if (!provider) return { label: "Unknown", color: "bg-muted text-muted-foreground" };
    
    const providerLower = provider.toLowerCase();
    
    // Map model names to providers
    if (providerLower.includes('gpt') || providerLower.includes('openai')) {
      return { label: "GPT-4", color: "bg-green-500/10 text-green-500" };
    }
    if (providerLower.includes('claude')) {
      return { label: "Claude", color: "bg-purple-500/10 text-purple-500" };
    }
    if (providerLower.includes('cohere')) {
      return { label: "Cohere", color: "bg-blue-500/10 text-blue-500" };
    }
    if (providerLower.includes('llama') || providerLower.includes('groq')) {
      return { label: "Groq", color: "bg-orange-500/10 text-orange-500" };
    }
    
    // Default mapping for provider names
    const badges: Record<string, { label: string; color: string }> = {
      cohere: { label: "Cohere", color: "bg-blue-500/10 text-blue-500" },
      openai: { label: "GPT-4", color: "bg-green-500/10 text-green-500" },
      claude: { label: "Claude", color: "bg-purple-500/10 text-purple-500" },
      groq: { label: "Groq", color: "bg-orange-500/10 text-orange-500" },
    };
    return badges[providerLower] || { label: provider, color: "bg-muted text-muted-foreground" };
  };

  const getModeBadge = (mode: string | null) => {
    if (!mode) return null;
    const modes: Record<string, { label: string; color: string }> = {
      snapshot: { label: "Snapshot", color: "bg-cyan-500/10 text-cyan-500" },
      expanded: { label: "Expanded", color: "bg-purple-500/10 text-purple-500" },
      deep: { label: "Deep", color: "bg-pink-500/10 text-pink-500" },
    };
    return modes[mode] || null;
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
                  const intent = getIntentLabel(result);
                  const tone = getToneLabel(result);
                  const interestLevel = getInterestLevel(result);
                  const risk = getEmotionalRisk(result);
                  const riskBadge = getRiskBadge(risk);
                  const providerBadge = getProviderBadge(item.provider_used || "unknown");
                  const modeBadge = getModeBadge(item.mode);
                  
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
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {intent && intent !== "Onbekend" && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Intent: {intent}
                              </span>
                            )}
                            {tone && tone !== "Neutraal" && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Tone: {tone}
                              </span>
                            )}
                            {interestLevel > 0 && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Interest: {interestLevel}%
                              </span>
                            )}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskBadge.color}`}>
                              {riskBadge.label}
                            </span>
                            {providerBadge.label && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${providerBadge.color}`}>
                                {providerBadge.label}
                              </span>
                            )}
                            {modeBadge && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${modeBadge.color}`}>
                                {modeBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
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
          onAnalysisIdChange={(newAnalysisId) => {
            setSelectedAnalysisId(newAnalysisId);
          }}
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
