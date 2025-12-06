import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsufficientCreditsModal } from "@/components/modals/InsufficientCreditsModal";
import { BuyCreditsModal } from "@/components/modals/BuyCreditsModal";
import { AnalysisConfirmModal } from "@/components/modals/AnalysisConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { AnalysisResults } from "@/components/dashboard/AnalysisResults";
import {
  MessageSquare,
  Upload,
  Sparkles,
  Loader2,
  Zap,
  RefreshCw,
  ImageIcon,
  X,
  Info,
} from "lucide-react";

type AnalysisState = "idle" | "loading" | "results";
type AnalysisMode = "snapshot" | "expanded" | "deep";

export interface AnalysisResult {
  intent: string;
  intentLabel: "positive" | "neutral" | "negative";
  toneScore: number;
  tone: string;
  category: string;
  interestLevel: number;
  emotionalRisk: "low" | "medium" | "high";
  flags: string[];
  suggested_replies: Array<{
    type: string;
    text: string;
  }>;
  recommended_timing: string;
  escalation?: string;
  expanded_analysis?: string;
  deep_analysis?: string;
  conversation_flow?: string[];
}

const MODE_CREDITS: Record<AnalysisMode, number> = {
  snapshot: 5,
  expanded: 10,
  deep: 30,
};

const MODE_LABELS: Record<AnalysisMode, string> = {
  snapshot: "Snapshot",
  expanded: "Expanded",
  deep: "Deep",
};

export const AnalysisWorkspace = () => {
  const [inputText, setInputText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("snapshot");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);
  const [creditsLimit, setCreditsLimit] = useState<number>(100);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const data = await api.getCredits();
      setCreditsRemaining(data.credits_remaining);
      setCreditsLimit(data.daily_limit);
    } catch (error) {
      console.error("Failed to load credits:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const getActionCost = () => {
    const baseCost = MODE_CREDITS[analysisMode];
    const imageCost = imageFile ? 50 : 0;
    return baseCost + imageCost;
  };

  const handleAnalyzeClick = () => {
    if (!inputText.trim() && !imageFile) {
      toast({
        title: "Error",
        description: "Please enter text or upload an image",
        variant: "destructive",
      });
      return;
    }

    const cost = getActionCost();
    if (creditsRemaining < cost) {
      setCreditsNeeded(cost);
      setShowInsufficientCredits(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmAnalyze = async () => {
    setShowConfirmModal(false);
    setAnalysisState("loading");
    setResult(null);

    try {
      // Map analysis mode to MessageMind format
      const mode: 'snapshot' | 'expanded' | 'deep' = analysisMode;
      
      // Prepare images array if image exists
      const images = imagePreview ? [imagePreview] : undefined;

      const response = await api.executeAction({
        mode: mode,
        input_text: inputText || undefined,
        images: images,
        use_premium: analysisMode === "deep",
      });

      // Handle cached results
      if (response.cached && response.analysis_json) {
        const transformedResult = transformApiResult(response.analysis_json);
        setResult(transformedResult);
        setAnalysisState("results");
        setCreditsRemaining(response.credits_remaining);
        return;
      }

      setCurrentAnalysisId(response.analysis_id);
      setCreditsRemaining(response.credits_remaining);
      pollAnalysis(response.analysis_id);
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      if (error.error === "insufficient_credits") {
        setCreditsNeeded(error.credits_needed || getActionCost());
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: "Error",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
      
      setAnalysisState("idle");
    }
  };

  const transformApiResult = (apiResult: any): AnalysisResult => {
    return {
      intent: apiResult.intent || "Unknown",
      intentLabel: apiResult.intentLabel || (apiResult.emotional_risk === 'low' ? 'positive' : apiResult.emotional_risk === 'high' ? 'negative' : 'neutral'),
      toneScore: apiResult.toneScore || 50,
      tone: apiResult.tone || "neutral",
      category: apiResult.category || "general",
      interestLevel: apiResult.interestLevel || 50,
      emotionalRisk: apiResult.emotional_risk || "low",
      flags: apiResult.flags || [],
      suggested_replies: Array.isArray(apiResult.suggested_replies) 
        ? apiResult.suggested_replies.map((reply: string | { type?: string; text?: string }) => {
            if (typeof reply === 'string') {
              return { type: "Direct", text: reply };
            }
            return { type: reply.type || "Direct", text: reply.text || "" };
          })
        : [],
      recommended_timing: apiResult.recommended_timing || "Wait 2-4 hours",
      escalation: apiResult.escalation_advice,
      expanded_analysis: apiResult.explanation ? (Array.isArray(apiResult.explanation) ? apiResult.explanation.join('\n') : apiResult.explanation) : undefined,
      deep_analysis: apiResult.explanation,
      conversation_flow: apiResult.conversation_flow ? (Array.isArray(apiResult.conversation_flow) ? apiResult.conversation_flow.map((f: any) => f.message || f) : []) : undefined,
    };
  };

  const pollAnalysis = async (analysisId: string, retries = 0) => {
    const maxRetries = 30;
    if (retries >= maxRetries) {
      toast({
        title: "Timeout",
        description: "Analysis is taking longer than expected. Please try again.",
        variant: "destructive",
      });
      setAnalysisState("idle");
      return;
    }

    try {
      const analysis = await api.getAnalysis(analysisId);

      if (analysis.status === "done" && analysis.analysis_json) {
        const transformedResult = transformApiResult(analysis.analysis_json);
        setResult(transformedResult);
        setAnalysisState("results");
      } else if (analysis.status === "failed") {
        toast({
          title: "Analysis failed",
          description: "The analysis could not be completed. Your credits may have been refunded.",
          variant: "destructive",
        });
        setAnalysisState("idle");
        loadCredits();
      } else {
        setTimeout(() => pollAnalysis(analysisId, retries + 1), 1000);
      }
    } catch (error) {
      console.error("Poll error:", error);
      setTimeout(() => pollAnalysis(analysisId, retries + 1), 1000);
    }
  };

  const handleReset = () => {
    setInputText("");
    setImageFile(null);
    setImagePreview(null);
    setAnalysisState("idle");
    setResult(null);
    setCurrentAnalysisId(null);
    setAnalysisMode("snapshot");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          {/* Input Tabs */}
          <Tabs defaultValue="text" className="mb-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4" />
                Paste text
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-background">
                <Upload className="h-4 w-4" />
                Upload screenshot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="Paste chat or upload screenshot..."
                className="min-h-[140px] resize-none bg-muted/30 border-border/50 focus:border-accent"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={analysisState === "loading"}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              {!imagePreview ? (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium mb-1">
                    Drag a screenshot here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Or click to upload (PNG, JPG)
                  </p>
                  <p className="text-xs text-accent mt-2">
                    Image analysis — 50 credits
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageUpload}
                    data-api="/api/user/action"
                    data-body='{"user_id": "string", "input": "base64_image", "mode": "image_analysis"}'
                  />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border/50">
                  <img
                    src={imagePreview}
                    alt="Uploaded screenshot"
                    className="w-full max-h-[200px] object-contain bg-muted/20"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium">Image uploaded — analysis includes visual content</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Mode selector with credit costs */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className={analysisMode === "snapshot" ? "text-accent font-medium" : ""}>
                Snapshot — 5 credits
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className={analysisMode === "expanded" ? "text-accent font-medium" : ""}>
                Expanded — 10 credits
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className={analysisMode === "deep" ? "text-accent font-medium" : ""}>
                Deep — 30 credits
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" />
              <span>{getActionCost()} credits per analysis</span>
            </div>
            
            <div className="flex gap-3">
              {analysisState === "results" && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                  data-api="/api/user/action"
                  data-body='{"action": "reset"}'
                >
                  <RefreshCw className="h-4 w-4" />
                  New analysis
                </Button>
              )}
              <Button
                variant="hero"
                onClick={handleAnalyzeClick}
                disabled={(!inputText.trim() && !imageFile) || analysisState === "loading"}
                className="gap-2 min-w-[140px]"
                data-api="/api/user/action"
                data-body='{"user_id": "string", "input": "string", "mode": "snapshot|expanded|deep"}'
              >
                {analysisState === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze now
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {analysisState === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-elevated p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                Analyzing — decoding your chat...
              </p>
              <p className="text-sm text-muted-foreground">
                This usually takes 5-10 seconds
              </p>
            </motion.div>
          )}

          {analysisState === "results" && result && (
            <AnalysisResults
              result={result}
              analysisMode={analysisMode}
              setAnalysisMode={setAnalysisMode}
              currentAnalysisId={currentAnalysisId}
              creditsRemaining={creditsRemaining}
              onModeChange={(mode) => {
                const cost = MODE_CREDITS[mode];
                if (creditsRemaining < cost) {
                  setCreditsNeeded(cost);
                  setShowInsufficientCredits(true);
                  return;
                }
                setAnalysisMode(mode);
              }}
            />
          )}

          {analysisState === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-8 bg-gradient-card text-center"
            >
              <Sparkles className="h-10 w-10 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to start?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Paste her message or upload a screenshot to see what she really means.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-foreground">Intent & Tone</p>
                  <p className="text-muted-foreground text-xs">Decode hidden meaning</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-foreground">3 Ready Replies</p>
                  <p className="text-muted-foreground text-xs">Copy & send</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-foreground">Timing Tips</p>
                  <p className="text-muted-foreground text-xs">When to respond</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        onBuyCredits={() => {
          setShowInsufficientCredits(false);
          setShowBuyCredits(true);
        }}
        onUpgrade={() => {
          setShowInsufficientCredits(false);
          window.location.href = "/pricing";
        }}
        creditsNeeded={creditsNeeded}
        creditsAvailable={creditsRemaining}
      />
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => {
          setShowBuyCredits(false);
          loadCredits();
        }}
        data-api="/api/user/buy_pack"
      />
      <AnalysisConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAnalyze}
        mode={analysisMode}
        credits={getActionCost()}
        hasImage={!!imageFile}
      />
    </>
  );
};
