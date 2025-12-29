import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResults } from "@/components/dashboard/AnalysisResults";

interface AnalysisDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  onAnalysisIdChange?: (newAnalysisId: string) => void;
}

export const AnalysisDetailModal = ({ isOpen, onClose, analysisId, onAnalysisIdChange }: AnalysisDetailModalProps) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && analysisId) {
      loadAnalysis();
    }
  }, [isOpen, analysisId]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      console.log(`[AnalysisDetailModal] Loading analysis ${analysisId}`);
      const data = await api.getAnalysis(analysisId);
      console.log(`[AnalysisDetailModal] Loaded analysis:`, data);
      setAnalysis(data);
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast({
        title: "Fout",
        description: "Kon analyse niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeUpgrade = async (newMode: "expanded" | "deep") => {
    if (!analysis) return;

    setIsUpgrading(true);
    setIsLoading(true);
    try {
      console.log(`[AnalysisDetailModal] Upgrading analysis to ${newMode} mode`);
      console.log(`[AnalysisDetailModal] Input text length:`, analysis.input_text?.length || 0);
      console.log(`[AnalysisDetailModal] Image URL:`, analysis.image_url ? "present" : "none");
      
      // Prepare images array - only include if image_url is present
      const images = analysis.image_url ? [analysis.image_url] : undefined;
      
      console.log(`[AnalysisDetailModal] Calling executeAction with:`, {
        mode: newMode,
        input_text: analysis.input_text ? `${analysis.input_text.substring(0, 50)}...` : "empty",
        images: images ? "present" : "none",
      });
      
      // Start a new analysis with the same input text but higher mode
      const result = await api.executeAction({
        mode: newMode,
        input_text: analysis.input_text || "",
        images: images,
      });

      console.log(`[AnalysisDetailModal] New analysis ID: ${result.analysis_id}`);

      if (result.analysis_id) {
        // Wait longer for the analysis to be fully processed
        console.log(`[AnalysisDetailModal] Waiting for analysis to be processed...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load the new analysis with retry logic
        let newAnalysis = null;
        let retries = 3;
        while (!newAnalysis && retries > 0) {
          try {
            console.log(`[AnalysisDetailModal] Fetching analysis (attempts remaining: ${retries})`);
            newAnalysis = await api.getAnalysis(result.analysis_id);
            if (newAnalysis?.analysis_json || newAnalysis?.analysis_result) {
              console.log(`[AnalysisDetailModal] Successfully loaded new analysis`);
              break;
            }
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (e) {
            console.error(`[AnalysisDetailModal] Fetch attempt failed:`, e);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!newAnalysis) {
          throw new Error("Failed to load upgraded analysis after retries");
        }
        
        setAnalysis(newAnalysis);
        
        // Update the parent component with the new analysis ID
        if (onAnalysisIdChange) {
          onAnalysisIdChange(result.analysis_id);
        }
        
        toast({
          title: "Success!",
          description: `Analysis upgraded to ${newMode} mode`,
        });
      }
    } catch (error: any) {
      console.error("Error upgrading analysis:", error);
      const errorMessage = error?.message || error?.error || "Kon analyse niet upgraden";
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Gekopieerd!",
      description: "Antwoord gekopieerd naar klembord",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  console.log(`[AnalysisDetailModal] Rendering with analysisId=${analysisId}, analysis=`, analysis);
  
  const analysisJson = analysis?.analysis_json || analysis?.analysis_result;
  console.log(`[AnalysisDetailModal] analysisJson=`, analysisJson);
  
  const transformedResult = analysisJson ? {
    intent: analysisJson.intent || "Unknown",
    intentLabel: analysisJson.intentLabel || (analysisJson.emotional_risk === 'low' ? 'positive' : analysisJson.emotional_risk === 'high' ? 'negative' : 'neutral'),
    toneScore: analysisJson.toneScore || 50,
    tone: analysisJson.tone || "neutral",
    category: analysisJson.category || "general",
    interestLevel: analysisJson.interestLevel || analysisJson.interest_level || 50,
    interest_level: analysisJson.interestLevel || analysisJson.interest_level || 50,
    emotional_risk: analysisJson.emotional_risk || "low",
    emotionalRisk: analysisJson.emotional_risk || "low",
    flags: analysisJson.flags || [],
    suggested_replies: Array.isArray(analysisJson.suggested_replies) 
      ? analysisJson.suggested_replies.map((reply: string | { type?: string; text?: string }) => {
          if (typeof reply === 'string') {
            return { type: "Direct", text: reply };
          }
          return { type: reply.type || "Direct", text: reply.text || "" };
        })
      : (typeof analysisJson.suggested_replies === 'object' 
        ? Object.entries(analysisJson.suggested_replies).map(([key, value]) => ({
            type: key.charAt(0).toUpperCase() + key.slice(1),
            text: typeof value === 'string' ? value : String(value)
          }))
        : []),
    recommended_timing: analysisJson.recommended_timing || "Wait 2-4 hours",
    escalation_advice: analysisJson.escalation_advice || analysisJson.escalation,
    explanation: analysisJson.explanation || undefined,
    conversation_flow: analysisJson.conversation_flow ? (Array.isArray(analysisJson.conversation_flow) ? analysisJson.conversation_flow : []) : undefined,
  } : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            // Only close if clicking on the backdrop itself, not on modal content
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-hero p-6 flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold font-display text-primary-foreground">
                Analyse Details
              </h2>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto p-6"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : transformedResult ? (
                <AnalysisResults
                  key={analysis?.id || analysisId}
                  result={transformedResult}
                  analysisMode={analysis?.mode_used || "snapshot"}
                  setAnalysisMode={() => {}}
                  currentAnalysisId={analysis?.id || analysisId}
                  creditsRemaining={analysis?.credits_remaining || 0}
                  creditsSpent={analysis?.credits_charged || 0}
                  providerUsed={analysis?.provider_used || "Unknown"}
                  modeUsed={analysis?.mode_used || "snapshot"}
                  onModeChange={handleModeUpgrade}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Geen analyse data gevonden</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

