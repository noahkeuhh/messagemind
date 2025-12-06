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
} from "lucide-react";

type AnalysisMode = "snapshot" | "expanded" | "deep";

interface AnalysisResultsProps {
  result: AnalysisResult;
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  currentAnalysisId: string | null;
  creditsRemaining: number;
  onModeChange: (mode: AnalysisMode) => void;
}

const REPLY_ICONS: Record<string, typeof MessageSquare> = {
  Direct: ArrowRight,
  Playful: Heart,
  Confident: TrendingUp,
  "Option 1": ArrowRight,
  "Option 2": Heart,
  "Option 3": TrendingUp,
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
  onModeChange,
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

    const reply = result.suggested_replies[index];
    if (!reply) return;

    try {
      await api.saveReply({
        reply_text: reply.text,
        reply_type: reply.type,
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

  const riskConfig = RISK_COLORS[result.emotionalRisk] || RISK_COLORS.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Result Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Layers className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="expanded"
            className="gap-2"
            disabled={analysisMode === "snapshot"}
          >
            <Lightbulb className="h-4 w-4" />
            Expanded
            {analysisMode === "snapshot" && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger
            value="deep"
            className="gap-2"
            disabled={analysisMode !== "deep"}
          >
            <BookOpen className="h-4 w-4" />
            Deep
            {analysisMode !== "deep" && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="explanation" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Explanation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main results */}
            <div className="lg:col-span-2 space-y-4">
              {/* Summary cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Intent</p>
                  <p
                    className={`font-semibold text-sm ${
                      result.intentLabel === "positive"
                        ? "text-success"
                        : result.intentLabel === "negative"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
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

              {/* Flags */}
              {result.flags.length > 0 && (
                <div className="card-elevated p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <p className="font-medium text-foreground text-sm">Signals</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.flags.map((flag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-warning/10 text-warning text-xs rounded-full"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested replies */}
              <div className="card-elevated p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  Recommended Replies
                </h3>
                <div className="space-y-3">
                  {result.suggested_replies.map((reply, index) => {
                    const Icon = REPLY_ICONS[reply.type] || MessageSquare;
                    const optionLabel = `Option ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className="p-4 bg-muted/50 rounded-xl group hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-accent flex items-center gap-1.5">
                            <Icon className="h-4 w-4" />
                            {optionLabel} — {reply.type}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleSave(index)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                savedIndices.includes(index)
                                  ? "bg-accent/20 text-accent"
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

            {/* Timing panel */}
            <div className="space-y-4">
              <div className="card-elevated p-5 bg-gradient-card">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-accent" />
                  <h3 className="font-bold text-foreground">Recommended Timing</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.recommended_timing}
                </p>
              </div>

              {/* Upgrade prompt for snapshot mode */}
              {analysisMode === "snapshot" && (
                <div className="card-elevated p-5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <p className="font-medium text-foreground text-sm">Want more detail?</p>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">
                    Upgrade to Expanded for deeper insights and more reply options.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => onModeChange("expanded")}
                    data-api="/api/user/action"
                    data-body='{"mode": "expanded", "upgrade": true}'
                  >
                    Expanded Preview — 10 credits
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Interest meter */}
              <div className="card-elevated p-5">
                <p className="text-xs text-muted-foreground mb-2">Interest Level</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all"
                      style={{ width: `${result.interestLevel}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {result.interestLevel}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Expanded Tab */}
        <TabsContent value="expanded" className="mt-6">
          {analysisMode !== "snapshot" ? (
            <div className="space-y-6">
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent" />
                  Expanded Analysis
                </h3>
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    {result.expanded_analysis ||
                      "Based on the message context, she appears to be interested but wants to see more initiative from your side. The tone suggests playfulness with underlying curiosity. Key signals include her use of casual language combined with question marks, indicating she's open to conversation but waiting for you to lead."}
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li>• She's testing your confidence level</li>
                    <li>• Open to plans but wants you to be specific</li>
                    <li>• Positive undertone despite casual wording</li>
                  </ul>
                </div>
              </div>

              {/* Additional reply variants for expanded */}
              <div className="card-elevated p-5">
                <h3 className="font-bold text-foreground mb-4">Extra Reply Variants</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-accent font-medium mb-2">Flirty</p>
                    <p className="text-sm text-foreground">
                      "I like how you're keeping me guessing 😏 Let's skip the small talk — drinks Friday?"
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-accent font-medium mb-2">Mysterious</p>
                    <p className="text-sm text-foreground">
                      "Interesting... I have something in mind. Free this weekend?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-elevated p-8 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                Expanded Analysis Locked
              </h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Expanded mode to unlock detailed analysis and extra reply options.
              </p>
              <Button
                onClick={() => onModeChange("expanded")}
                className="gap-2"
                data-api="/api/user/action"
                data-body='{"mode": "expanded"}'
              >
                <Zap className="h-4 w-4" />
                Unlock for 10 credits
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Deep Tab */}
        <TabsContent value="deep" className="mt-6">
          {analysisMode === "deep" ? (
            <div className="space-y-6">
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Deep Analysis — Full GPT-4 Style
                </h3>
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    {result.deep_analysis ||
                      "This message reveals a complex interplay of interest and self-protection. The sender is clearly engaged but employs casual language as a defense mechanism against appearing too eager. Analysis of word choice, punctuation patterns, and response timing suggests genuine attraction masked by learned dating behaviors."}
                  </p>
                </div>
              </div>

              {/* Conversation flow */}
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4">Conversation Flow</h3>
                <div className="space-y-3">
                  {(result.conversation_flow || [
                    "Initial interest shown through question",
                    "Testing phase with casual deflection",
                    "Opportunity for confident response",
                    "Recommended: Direct proposal with specific time",
                  ]).map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk analysis */}
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4">Risk Analysis</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Ghosting Risk</p>
                    <p className="text-lg font-bold text-success">Low</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Commitment Level</p>
                    <p className="text-lg font-bold text-warning">Medium</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Attraction Score</p>
                    <p className="text-lg font-bold text-accent">{result.interestLevel}%</p>
                  </div>
                </div>
              </div>

              {/* Persona tips */}
              <div className="card-elevated p-6">
                <h3 className="font-bold text-foreground mb-4">Persona Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    Match her energy level but lead the conversation
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    Use humor to break tension without being try-hard
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    Propose concrete plans within 2-3 messages
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="card-elevated p-8 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                Deep Analysis Locked
              </h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Deep mode for full narrative analysis, conversation flow, and persona tips.
              </p>
              <Button
                onClick={() => onModeChange("deep")}
                className="gap-2"
                data-api="/api/user/action"
                data-body='{"mode": "deep"}'
              >
                <Zap className="h-4 w-4" />
                Unlock for 30 credits
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Explanation Tab */}
        <TabsContent value="explanation" className="mt-6">
          <div className="card-elevated p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Understanding Your Analysis
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Intent</h4>
                <p className="text-sm text-muted-foreground">
                  Intent reveals the underlying motivation behind her message. A "positive" intent
                  indicates genuine interest, while "neutral" suggests she's still evaluating.
                  "Negative" doesn't always mean rejection — it could indicate frustration or testing.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Tone</h4>
                <p className="text-sm text-muted-foreground">
                  Tone analysis examines the emotional quality of the message. Flirty, playful, serious,
                  or distant — understanding tone helps you calibrate your response style.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Category</h4>
                <p className="text-sm text-muted-foreground">
                  Message category identifies the type of communication: date proposal, casual chat,
                  testing behavior, or relationship discussion. This guides your response strategy.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Emotional Risk</h4>
                <p className="text-sm text-muted-foreground">
                  Risk levels indicate how sensitive the conversation is. High risk means proceed
                  carefully — wrong responses could damage the connection. Low risk allows for
                  more playful experimentation.
                </p>
              </div>

              {/* Action steps for Plus/Max */}
              {analysisMode !== "snapshot" && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <h4 className="font-medium text-foreground mb-3">What to Do Next</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">1</span>
                      Review the suggested replies and pick one that matches your style
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">2</span>
                      Consider the timing recommendation before hitting send
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">3</span>
                      Personalize the reply slightly to sound authentic
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">4</span>
                      Save successful replies for future reference
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center">5</span>
                      Track your conversation history to see patterns
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
