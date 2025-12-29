import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { AnalysisResult } from "./AnalysisWorkspace";
import {
  Copy,
  Check,
  Star,
  Clock,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Heart,
  ArrowRight,
  Zap,
  Lock,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Layers,
  ChevronDown,
} from "lucide-react";

type AnalysisMode = "snapshot" | "expanded" | "deep";

interface AnalysisResultsProps {
  result: AnalysisResult;
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  currentAnalysisId: string | null;
  creditsRemaining: number;
  creditsSpent: number;
  providerUsed: string | null;
  modeUsed: string | null;
  onModeChange: (mode: AnalysisMode) => void;
  subscriptionTier?: string;
}

const REPLY_ICONS: Record<string, typeof MessageSquare> = {
  direct: ArrowRight,
  playful: Heart,
  confident: TrendingUp,
  safe: MessageSquare,
  bold: Zap,
  escalation: TrendingUp,
};

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-success/10", text: "text-success", label: "Low" },
  medium: { bg: "bg-warning/10", text: "text-warning", label: "Medium" },
  high: { bg: "bg-destructive/10", text: "text-destructive", label: "High" },
};

export const AnalysisResults = ({
  result,
  analysisMode,
  setAnalysisMode,
  currentAnalysisId,
  creditsRemaining,
  creditsSpent,
  providerUsed,
  modeUsed,
  onModeChange,
  subscriptionTier = "free",
}: AnalysisResultsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Copied!",
      description: "Reply copied to clipboard",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSave = async (index: number) => {
    if (!result || !currentAnalysisId) return;

    const replies = Array.isArray(result.suggested_replies)
      ? result.suggested_replies
      : Object.values(result.suggested_replies || {});
    
    const reply = replies[index];
    if (!reply) return;

    try {
      const replyText = typeof reply === "string" ? reply : reply.text;
      await api.saveReply({
        reply_text: replyText,
        reply_type: typeof reply === "string" ? "option" : reply.type || "option",
        analysis_id: currentAnalysisId,
      });

      if (savedIndices.includes(index)) {
        setSavedIndices(savedIndices.filter((i) => i !== index));
        toast({
          title: "Removed",
          description: "Reply removed from saved replies",
        });
      } else {
        setSavedIndices([...savedIndices, index]);
        toast({
          title: "Saved!",
          description: "Reply saved to your collection",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not save reply",
        variant: "destructive",
      });
    }
  };

  const riskConfig = RISK_COLORS[result.emotional_risk] || RISK_COLORS.low;
  
  // Parse suggested replies - can be array or object (deep mode)
  const suggestionList = Array.isArray(result.suggested_replies)
    ? result.suggested_replies.map((r, i) => ({
        type: typeof r === "string" ? `Option ${i + 1}` : r.type || `Option ${i + 1}`,
        text: typeof r === "string" ? r : r.text,
      }))
    : Object.entries(result.suggested_replies || {}).map(([type, text]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        text: typeof text === "string" ? text : String(text),
      }));

  // Get interest level (0-100 scale)
  const interestLevel = typeof result.interest_level === "string"
    ? parseInt(result.interest_level)
    : result.interest_level || 0;

  // Get explanation
  const explanation = result.explanation
    ? typeof result.explanation === "string"
      ? result.explanation
      : result.explanation
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with credits only */}
      <div className="card-elevated p-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Credits Spent</p>
            <p className="font-medium text-sm text-foreground">-{creditsSpent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Credits Remaining</p>
            <p className="font-medium text-sm text-foreground">{creditsRemaining}</p>
          </div>
        </div>
      </div>

      {/* Result Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Layers className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="explanation"
            className="gap-2"
            disabled={!explanation}
          >
            <Lightbulb className="h-4 w-4" />
            Explanation
            {!explanation && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          {analysisMode === "deep" && (
            <TabsTrigger value="deep" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Deep Analysis
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main results */}
            <div className="lg:col-span-2 space-y-4">
              {/* Summary cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Intent</p>
                  <p className="font-semibold text-sm text-foreground">
                    {result.intent}
                  </p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Tone</p>
                  <p className="font-semibold text-sm text-foreground capitalize">
                    {result.tone}
                  </p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold text-sm text-foreground capitalize">
                    {result.category}
                  </p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Emotional Risk</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskConfig.bg} ${riskConfig.text}`}
                  >
                    {riskConfig.label}
                  </span>
                </div>
              </div>

              {/* Recommended timing */}
              <div className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">Recommended Timing</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.recommended_timing}
                </p>
              </div>

              {/* Suggested replies */}
              <div className="card-elevated p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  Recommended Replies
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {suggestionList.length} option{suggestionList.length !== 1 ? "s" : ""}
                  </span>
                </h3>
                <div className="space-y-3">
                  {suggestionList.map((reply, index) => {
                    const Icon = REPLY_ICONS[reply.type.toLowerCase()] || MessageSquare;
                    return (
                      <div
                        key={index}
                        className="p-4 bg-muted/50 rounded-xl group hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-accent flex items-center gap-1.5">
                            <Icon className="h-4 w-4" />
                            {reply.type}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleSave(index)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                savedIndices.includes(index)
                                  ? "bg-accent/10 text-accent border border-accent/30"
                                  : "hover:bg-background text-muted-foreground"
                              }`}
                              aria-label="Save reply"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  savedIndices.includes(index) ? "fill-current" : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => handleCopy(reply.text, index)}
                              className="p-1.5 rounded-lg hover:bg-background text-muted-foreground transition-colors"
                              aria-label="Copy reply"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-foreground text-sm">{reply.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar: Interest level and info */}
            <div className="space-y-4">
              {/* Interest level with colored bar */}
              {interestLevel > 0 && (
                <div className="card-elevated p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Interest Level</p>
                  <div className="flex items-end gap-3 mb-2">
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            interestLevel < 40
                              ? "bg-destructive"
                              : interestLevel < 70
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                          style={{ width: `${interestLevel}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xl font-bold text-foreground w-12 text-right">
                      {interestLevel}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {interestLevel < 40
                      ? "Low interest - Build rapport"
                      : interestLevel < 70
                      ? "Moderate interest - Keep momentum"
                      : "High interest - Time to escalate"}
                  </div>
                </div>
              )}

              {/* Upgrade info - Only show for PRO tier (PLUS/MAX have auto-mode) */}
              {subscriptionTier === 'pro' && analysisMode === "snapshot" && (
                <div className="card-elevated p-5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    <p className="font-medium text-foreground text-sm">Want more detail?</p>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">
                    Enable Expanded toggle for deeper insights.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => onModeChange("expanded")}
                  >
                    <Zap className="h-3 w-3" />
                    Expanded toggle — +12 credits
                  </Button>
                </div>
              )}

              {/* Tier-specific mode messaging */}
              {subscriptionTier === 'plus' && analysisMode === "expanded" && (
                <div className="card-elevated p-5 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-accent" />
                    <p className="font-medium text-foreground text-sm">Auto-mode actief</p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Expanded mode automatically selected based on your input.
                  </p>
                </div>
              )}

              {subscriptionTier === 'pro' && (analysisMode === "snapshot" || analysisMode === "expanded") && (
                <div className="card-elevated p-5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground text-sm">Deep Mode</p>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">
                    Deep mode requires Max tier (auto-selected for images and long text).
                  </p>
                </div>
              )}

              {subscriptionTier === 'plus' && (analysisMode === "snapshot" || analysisMode === "expanded") && (
                <div className="card-elevated p-5 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground text-sm">Deep Mode</p>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">
                    Upgrade to Max tier for Deep mode (auto-selected for images and long text).
                  </p>
                </div>
              )}

              {subscriptionTier === 'max' && analysisMode === "deep" && (
                <div className="card-elevated p-5 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-accent" />
                    <p className="font-medium text-foreground text-sm">Deep mode actief</p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Most comprehensive analysis - automatically selected based on your input.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Explanation Tab */}
        <TabsContent value="explanation" className="mt-6">
          {explanation ? (
            <div className="space-y-4">
              {/* Handle both string and structured explanations */}
              {typeof explanation === "string" ? (
                <div className="card-elevated p-6">
                  <h3 className="font-bold text-foreground mb-4">Analysis Explanation</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {explanation}
                  </p>
                </div>
              ) : (
                // Structured explanation (Deep mode)
                <div className="space-y-4">
                  {explanation.meaning_breakdown && (
                    <div className="card-elevated p-6">
                      <h3 className="font-bold text-foreground mb-3">Meaning Breakdown</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {explanation.meaning_breakdown}
                      </p>
                    </div>
                  )}
                  {explanation.emotional_context && (
                    <div className="card-elevated p-6">
                      <h3 className="font-bold text-foreground mb-3">Emotional Context</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {explanation.emotional_context}
                      </p>
                    </div>
                  )}
                  {explanation.relationship_signals && (
                    <div className="card-elevated p-6">
                      <h3 className="font-bold text-foreground mb-3">Relationship Signals</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {explanation.relationship_signals}
                      </p>
                    </div>
                  )}
                  {explanation.hidden_patterns && (
                    <div className="card-elevated p-6">
                      <h3 className="font-bold text-foreground mb-3">Hidden Patterns</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {explanation.hidden_patterns}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card-elevated p-8 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                Explanation Locked
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upgrade to unlock detailed explanations.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Deep Analysis Tab */}
        {analysisMode === "deep" && (
          <TabsContent value="deep" className="mt-6 space-y-6">
            {/* Conversation flow */}
            {result.conversation_flow && result.conversation_flow.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4">Conversation Flow</h3>
                <div className="space-y-4">
                  {result.conversation_flow.map((step: any, i: number) => {
                    const isYou = step.you;
                    const isReaction = step.them_reaction;
                    const isNext = step.you_next;
                    
                    const text = isYou || isReaction || isNext;
                    const role = isYou ? "You" : isReaction ? "Her reaction" : "You (next)";
                    
                    return (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-medium text-sm">
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {role}
                          </p>
                          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Escalation advice */}
            {result.escalation_advice && (
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Escalation Advice
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.escalation_advice}
                </p>
              </div>
            )}

            {/* Risk mitigation */}
            {result.risk_mitigation && (
              <div className="card-elevated p-6 border-warning/20">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Risk Mitigation
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.risk_mitigation}
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};
