import { useState, useEffect } from "react";
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
}

export const AnalysisDetailModal = ({ isOpen, onClose, analysisId }: AnalysisDetailModalProps) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && analysisId) {
      loadAnalysis();
    }
  }, [isOpen, analysisId]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalysis(analysisId);
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

  const analysisJson = analysis?.analysis_json || analysis?.analysis_result;
  const transformedResult = analysisJson ? {
    intent: analysisJson.intent || "Unknown",
    intentLabel: analysisJson.intentLabel || (analysisJson.emotional_risk === 'low' ? 'positive' : analysisJson.emotional_risk === 'high' ? 'negative' : 'neutral'),
    toneScore: analysisJson.toneScore || 50,
    tone: analysisJson.tone || "neutral",
    category: analysisJson.category || "general",
    interestLevel: analysisJson.interestLevel || 50,
    emotionalRisk: analysisJson.emotional_risk || "low",
    flags: analysisJson.flags || [],
    suggested_replies: Array.isArray(analysisJson.suggested_replies) 
      ? analysisJson.suggested_replies.map((reply: string | { type?: string; text?: string }) => {
          if (typeof reply === 'string') {
            return { type: "Direct", text: reply };
          }
          return { type: reply.type || "Direct", text: reply.text || "" };
        })
      : [],
    recommended_timing: analysisJson.recommended_timing || "Wait 2-4 hours",
    escalation: analysisJson.escalation_advice,
    expanded_analysis: analysisJson.explanation ? (Array.isArray(analysisJson.explanation) ? analysisJson.explanation.join('\n') : analysisJson.explanation) : undefined,
    deep_analysis: analysisJson.explanation,
    conversation_flow: analysisJson.conversation_flow ? (Array.isArray(analysisJson.conversation_flow) ? analysisJson.conversation_flow.map((f: any) => f.message || f) : []) : undefined,
  } : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
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
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : transformedResult ? (
                <AnalysisResults
                  result={transformedResult}
                  analysisMode={analysis?.mode || "snapshot"}
                  setAnalysisMode={() => {}}
                  currentAnalysisId={analysisId}
                  creditsRemaining={0}
                  onModeChange={() => {}}
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

