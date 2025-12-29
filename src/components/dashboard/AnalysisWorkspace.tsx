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
import { useQueryClient } from "@tanstack/react-query";
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
  // Required fields (all modes)
  intent: string;
  tone: string;
  category: string;
  emotional_risk: "low" | "medium" | "high";
  recommended_timing: string;
  suggested_replies: Array<string | { type: string; text: string }> | Record<string, string>; // Array for snapshot/expanded, object for deep
  
  // Optional fields (conditional on mode/tier)
  interest_level?: number | string; // 0-100, present for Plus/Max expanded/deep
  explanation?: string | { 
    meaning_breakdown?: string;
    emotional_context?: string;
    relationship_signals?: string;
    hidden_patterns?: string;
  }; // Present for expanded/deep modes
  
  // Deep mode exclusive fields
  conversation_flow?: Array<{
    you?: string;
    them_reaction?: string;
    you_next?: string;
  }>;
  escalation_advice?: string;
  risk_mitigation?: string;
  
  // Legacy fields (for compatibility)
  intentLabel?: "positive" | "neutral" | "negative";
  toneScore?: number;
  interestLevel?: number;
  emotionalRisk?: "low" | "medium" | "high";
  flags?: string[];
  expanded_analysis?: string;
  deep_analysis?: string;
  provider_used?: string;
}

const MODE_CREDITS: Record<AnalysisMode, number> = {
  snapshot: 5,
  expanded: 12,
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
  const [creditsSpent, setCreditsSpent] = useState<number>(0);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [modeUsed, setModeUsed] = useState<string | null>(null);
  const [creditsLimit, setCreditsLimit] = useState<number>(100);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(5);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [expandedToggle, setExpandedToggle] = useState(false);
  const [explanationToggle, setExplanationToggle] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Load credits immediately on mount
    loadCredits();
    console.log('[AnalysisWorkspace] Mode-Included Premium system initialized');
  }, []);

  // Reset toggles when tier changes
  useEffect(() => {
    // Disable toggles that aren't available for the new tier
    if (!hasDeepToggle()) setExpandedToggle(false);
    // explanationToggle is removed
  }, [subscriptionTier]);

  // Auto-switch from deep to expanded if text becomes too short for MAX tier
  useEffect(() => {
    if (subscriptionTier === 'max' && analysisMode === 'deep' && !isDeepModeEnabled()) {
      setAnalysisMode('expanded');
    }
  }, [inputText, subscriptionTier, analysisMode]);

  const loadCredits = async () => {
    try {
      const data = await api.getCredits();
      console.log('[AnalysisWorkspace] Loaded credits:', data); // Debug log
      setCreditsRemaining(data.credits_remaining);
      setCreditsLimit(data.daily_limit);
      setSubscriptionTier(data.subscription_tier);
      console.log('[AnalysisWorkspace] Set tier to:', data.subscription_tier); // Debug log
    } catch (error) {
      console.error("[AnalysisWorkspace] Failed to load credits:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image before uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions: 1024x1024 for better token efficiency
          const maxDimension = 1024;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with higher compression (0.6 quality)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setImagePreview(compressedDataUrl);
          
          // Create a new file from compressed data
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              setImageFile(compressedFile);
            }
          }, 'image/jpeg', 0.6);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  /**
   * Calculate credit cost based on tier, mode, toggles, and input
   * Spec-compliant credit calculation:
   * - Base: text (5 short/12 long) + images (30 each) + input extra (floor(len/500))
   * - PRO: Expanded toggle +12, Explanation toggle +4
  * - PLUS: Expanded included (no surcharge), no Explanation surcharge
   * - MAX: Deep × 1.2 multiplier
   */
  const getActionCost = () => {
    // FREE tier: always 1 credit for their single snapshot analysis
    if (subscriptionTier === 'free') {
      return 1;
    }

    const SHORT_THRESHOLD = 200;
    const textLength = (inputText || '').trim().length;
    const imageCount = imageFile ? 1 : 0; // For now single image support
    const isShort = textLength <= SHORT_THRESHOLD;

    // Step 1: Calculate base text credits
    let baseTextCredits = 0;
    if (textLength > 0) {
      baseTextCredits = isShort ? 5 : 12;
    } else if (imageCount === 0) {
      // Only add 5 credits if there's no text AND no image
      baseTextCredits = 5;
    }
    // If imageCount > 0 and textLength === 0, baseTextCredits stays 0

    // Step 2: Calculate image credits (30 per image)
    const baseImageCredits = imageCount * 30;

    // Step 3: Calculate input extra credits (floor(length/500))
    const inputExtraCredits = Math.floor(textLength / 500);

    // Step 4: Calculate base total
    let baseTotal = baseTextCredits + baseImageCredits + inputExtraCredits;

    // Step 5: Apply tier-specific surcharges based on toggles
    let tierSurchargeCredits = 0;
    
    if (subscriptionTier === 'plus') {
      // PLUS: Deep toggle +12
      if (expandedToggle) tierSurchargeCredits += 12; // reusing expandedToggle state for deep
    }
    // PRO: no toggles shown
    // MAX: No surcharge in step 5, applied as multiplier in step 6
    // FREE: No surcharge

    // Step 6: Apply mode multipliers (MAX deep: 1.2x)
    let totalCreditsRequired = baseTotal + tierSurchargeCredits;
    
    // MAX: use selected mode (deep has 1.2x multiplier)
    if (subscriptionTier === 'max' && analysisMode === 'deep') {
      totalCreditsRequired = Math.ceil(baseTotal * 1.2) + tierSurchargeCredits;
    }

    return totalCreditsRequired;
  };

  /**
   * Determine available modes based on tier
   * FREE: snapshot only
   * PRO: snapshot + expanded (user toggle via expandedToggle)
   * PLUS: auto-determined (snapshot for short, expanded otherwise)
   * MAX: all modes available (snapshot, expanded, deep)
   */
  const getAvailableModes = (): AnalysisMode[] => {
    if (!subscriptionTier) return ['snapshot']; // Loading state
    if (subscriptionTier === 'free') return ['snapshot'];
    if (subscriptionTier === 'pro') return ['snapshot', 'expanded'];
    if (subscriptionTier === 'max') return ['snapshot', 'expanded', 'deep'];
    // PLUS: mode is auto-determined by backend
    return ['snapshot'];
  };

  /**
   * Check if deep mode is available (only for MAX tier with text > 100 chars)
   */
  const isDeepModeEnabled = (): boolean => {
    if (!subscriptionTier || subscriptionTier !== 'max') return false;
    const textLength = (inputText || '').trim().length;
    return textLength > 100;
  };

  /**
   * Get mode label with tier-specific messaging
   */
  const getModeLabelWithContext = (mode: AnalysisMode): string => {
    const labels: Record<AnalysisMode, string> = {
      snapshot: "Snapshot",
      expanded: "Expanded",
      deep: "Deep",
    };

    let label = labels[mode];

    if (subscriptionTier === 'plus' && mode === 'expanded') {
      label += " (included)";
    } else if (subscriptionTier === 'max' && mode === 'deep') {
      label += " (included)";
    }

    return label;
  };

  /**
   * Get available toggles based on tier
   * PLUS: deep toggle (+12 credits)
   * PRO: deep toggle code exists but UI hidden
   * MAX/FREE: no toggles
   */
  const hasDeepToggle = (): boolean => subscriptionTier === 'plus';

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
      console.log('[AnalysisWorkspace] Starting analysis:', { mode: analysisMode, hasText: !!inputText, hasImage: !!imageFile });
      
      // For MAX: use user-selected mode
      // For PLUS: mode is determined by expandedToggle (deep if checked)
      // For PRO: always snapshot
      // For FREE: always snapshot
      const mode: 'snapshot' | 'expanded' | 'deep' = 
        subscriptionTier === 'max' ? analysisMode : // MAX: use selected mode
        subscriptionTier === 'plus' && expandedToggle ? 'deep' :
        subscriptionTier === 'plus' && !expandedToggle ? 'expanded' : // PLUS default is expanded when deep toggle off
        'snapshot';
      
      // Prepare images array if image exists
      const images = imagePreview ? [imagePreview] : undefined;

      const response = await api.executeAction({
        mode: mode,
        input_text: inputText || undefined,
        images: images,
        expandedToggle: expandedToggle,
        explanationToggle: explanationToggle,
      });

      console.log('[AnalysisWorkspace] API response received:', { 
        analysis_id: response.analysis_id, 
        cached: response.cached, 
        provider_used: response.provider_used,
        credits_charged: response.credits_charged 
      });

      // Handle cached results - always use analysis_json from API (no mock data)
      if (response.cached && response.analysis_json) {
        console.log('[AnalysisWorkspace] Using cached result (no mock data)');
        const transformedResult = transformApiResult(response.analysis_json);
        setResult(transformedResult);
        setProviderUsed(response.provider_used || null);
        setModeUsed(response.mode_used || null);
        setCreditsSpent(response.credits_charged || 0);
        setAnalysisState("results");
        setCreditsRemaining(response.credits_remaining);
        // Invalidate credits query to refresh CreditMeter
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        return;
      }

      setCurrentAnalysisId(response.analysis_id);
      setCreditsSpent(response.credits_charged || 0);
      setCreditsRemaining(response.credits_remaining);
      pollAnalysis(response.analysis_id);
    } catch (error: any) {
      console.error("[AnalysisWorkspace] Analysis error:", error);
      
      // Handle specific API errors
      if (error.error === "insufficient_credits") {
        setCreditsNeeded(error.credits_needed || getActionCost());
        setShowInsufficientCredits(true);
      } else if (error.error === "deep_mode_not_allowed") {
        toast({
          title: "Deep Mode Requires Max Tier",
          description: "Deep analysis is only available with a Max subscription. Please upgrade to use this feature.",
          variant: "destructive",
        });
      } else if (error.error === "upgrade_required" || error.type === 'upgrade_required') {
        toast({
          title: "Upgrade Required",
          description: error.message || "Upgrade required to unlock Expanded Analysis, Explanation and Deep Mode.",
          variant: "destructive",
        });
      } else if (error.error === "batch_limit_exceeded") {
        toast({
          title: "Batch Limit Exceeded",
          description: error.message || "Your tier does not support this many batch inputs.",
          variant: "destructive",
        });
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
    // FINAL JSON spec - extract all fields directly from API response
    return {
      // Core fields (all modes)
      intent: apiResult.intent || "Unknown",
      tone: apiResult.tone || "neutral",
      category: apiResult.category || "general",
      emotional_risk: apiResult.emotional_risk || "medium",
      recommended_timing: apiResult.recommended_timing || "Wait",
      suggested_replies: apiResult.suggested_replies || [],
      
      // Optional fields based on mode/tier
      ...(apiResult.interest_level !== undefined && { interest_level: apiResult.interest_level }),
      ...(apiResult.explanation !== undefined && { explanation: apiResult.explanation }),
      ...(apiResult.conversation_flow !== undefined && { conversation_flow: apiResult.conversation_flow }),
      ...(apiResult.escalation_advice !== undefined && { escalation_advice: apiResult.escalation_advice }),
      ...(apiResult.risk_mitigation !== undefined && { risk_mitigation: apiResult.risk_mitigation }),
    };
  };

  const pollAnalysis = async (analysisId: string, retries = 0) => {
    const maxRetries = 30;
    if (retries >= maxRetries) {
      console.error(`[AnalysisWorkspace] Polling timeout after ${maxRetries} retries for analysis ${analysisId}`);
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
        console.log(`[AnalysisWorkspace] Analysis ${analysisId} completed, provider: ${analysis.provider_used}, mode: ${analysis.mode_used}`);
        console.log('[AnalysisWorkspace] Live API response received:', {
          analysis_id: analysisId,
          provider: analysis.provider_used,
          mode: analysis.mode_used,
          has_analysis_json: !!analysis.analysis_json,
          credits_charged: analysis.credits_charged,
          credits_remaining: analysis.credits_remaining,
        });
        // Always use analysis_json from API - no mock data
        const transformedResult = transformApiResult(analysis.analysis_json);
        setResult(transformedResult);
        setProviderUsed(analysis.provider_used || null);
        setModeUsed(analysis.mode_used || null);
        setCreditsSpent(analysis.credits_charged || creditsSpent);
        setAnalysisState("results");
        // Update credits immediately when analysis completes
        if (analysis.credits_remaining !== undefined) {
          setCreditsRemaining(analysis.credits_remaining);
          console.log(`[AnalysisWorkspace] Credits updated to ${analysis.credits_remaining} after analysis completion`);
        }
        // Invalidate credits query to refresh CreditMeter
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      } else if (analysis.status === "failed") {
        console.error(`[AnalysisWorkspace] Analysis ${analysisId} failed`);
        // Try to get more details about the failure
        const errorDetails = (analysis as any).error_message || 'Unknown error';
        console.error(`[AnalysisWorkspace] Failure details:`, errorDetails);
        
        toast({
          title: "Analysis failed",
          description: errorDetails.includes('not configured') 
            ? "AI service is not configured. Please contact support."
            : errorDetails.includes('API')
            ? "AI service error. Please try again or contact support."
            : "The analysis could not be completed. Your credits may have been refunded.",
          variant: "destructive",
        });
        setAnalysisState("idle");
        loadCredits();
      } else {
        // Update credits during polling if available (for live updates)
        if (analysis.credits_remaining !== undefined) {
          setCreditsRemaining(analysis.credits_remaining);
        }
        setTimeout(() => pollAnalysis(analysisId, retries + 1), 1000);
      }
    } catch (error) {
      console.error(`[AnalysisWorkspace] Poll error for analysis ${analysisId}:`, error);
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
    setExpandedToggle(false);
    setExplanationToggle(false);
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
              <TabsTrigger 
                value="upload" 
                className="gap-2 data-[state=active]:bg-background"
                disabled={subscriptionTier === 'free' || subscriptionTier === 'pro'}
                title={subscriptionTier === 'free' || subscriptionTier === 'pro' ? 'Upgrade to Plus or Max to upload images' : ''}
              >
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
                    Image analysis — 30 credits per image
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

          {/* Mode selector with tier-specific cost info */}
          <div className="space-y-3 mb-4">
            {/* Tier badge and mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent">
                  {subscriptionTier?.toUpperCase() || 'LOADING...'}
                </span>
              </div>
              {subscriptionTier === 'pro' && (
                <span className="text-xs text-muted-foreground">
                  Snapshot & Expanded modes
                </span>
              )}
              {subscriptionTier === 'plus' && (
                <span className="text-xs text-muted-foreground">
                  Expanded included, Deep (+12 credits)
                </span>
              )}
              {subscriptionTier === 'max' && (
                <span className="text-xs text-muted-foreground">
                  Deep included (×1.2)
                </span>
              )}
            </div>

            {/* Mode buttons - for FREE, PRO, and MAX */}
            {(subscriptionTier === 'free' || subscriptionTier === 'pro' || subscriptionTier === 'max') && (
              <div className="flex gap-2 flex-wrap">
                {getAvailableModes().map((mode) => {
                  const isDeepMode = mode === 'deep';
                  const deepDisabled = isDeepMode && !isDeepModeEnabled();
                  
                  return (
                    <button
                      key={mode}
                      onClick={() => !deepDisabled && setAnalysisMode(mode)}
                      disabled={analysisState === "loading" || deepDisabled}
                      className={`px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${
                        analysisMode === mode
                          ? "bg-accent/20 border-accent text-accent"
                          : deepDisabled
                          ? "bg-muted/10 border-border/30 text-muted-foreground/40 cursor-not-allowed"
                          : "bg-muted/30 border-border/50 text-foreground hover:border-accent/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={deepDisabled ? "Deep mode requires text longer than 100 characters" : undefined}
                    >
                      {getModeLabelWithContext(mode)}
                      {isDeepMode && subscriptionTier === 'max' && (
                        <span className="ml-1 text-xs">(×1.2)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Info for PLUS (auto-determined modes) */}
            {subscriptionTier === 'plus' && (
              <div className="text-sm text-muted-foreground">
                Mode auto-selected: Short text → Snapshot, Otherwise → Expanded
              </div>
            )}
            
            {/* Deep mode requirement hint for MAX */}
            {subscriptionTier === 'max' && !isDeepModeEnabled() && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Deep mode unlocks with text longer than 100 characters
              </div>
            )}

            {/* Analysis toggles - tier specific */}
            {hasDeepToggle() && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={expandedToggle}
                    onChange={(e) => setExpandedToggle(e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Deep Analyse</span>
                    <span className="text-xs text-muted-foreground ml-1">(+12 credits)</span>
                  </div>
                </label>
              </div>
            )}

            {/* Cost estimate with breakdown */}
            <div className="p-3 bg-muted/30 rounded-lg border border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {getActionCost()} credits
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {imageFile && inputText && inputText.trim().length > 0 && 'image + text'}
                      {imageFile && (!inputText || inputText.trim().length === 0) && 'image only'}
                      {!imageFile && inputText && inputText.trim().length > 0 && 'text only'}
                      {!imageFile && (!inputText || inputText.trim().length === 0) && 'no input yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div></div> {/* Empty spacer for layout */}
            
            <div className="flex gap-3">
              {analysisState === "results" && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
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
              <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
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
              creditsSpent={creditsSpent}
              providerUsed={providerUsed}
              modeUsed={modeUsed}
              subscriptionTier={subscriptionTier}
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
