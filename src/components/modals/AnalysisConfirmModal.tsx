import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles, ImageIcon, FileText } from "lucide-react";

interface AnalysisConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: "snapshot" | "expanded" | "deep";
  credits: number;
  hasImage: boolean;
}

const MODE_DESCRIPTIONS = {
  snapshot: "Quick overview with intent, tone, and 3 reply suggestions",
  expanded: "Detailed analysis with extra insights and more reply variants",
  deep: "Full GPT-4 style analysis with conversation flow and persona tips",
};

export const AnalysisConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  credits,
  hasImage,
}: AnalysisConfirmModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Confirm Analysis
          </DialogTitle>
          <DialogDescription>
            You're about to run an analysis. Please confirm the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground capitalize">{mode} Mode</p>
              <p className="text-sm text-muted-foreground">
                {MODE_DESCRIPTIONS[mode]}
              </p>
            </div>
          </div>

          {/* Image indicator */}
          {hasImage && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-accent/10 rounded-lg">
                <ImageIcon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Image Analysis</p>
                <p className="text-sm text-muted-foreground">
                  +50 credits for visual content analysis
                </p>
              </div>
            </div>
          )}

          {/* Credit cost */}
          <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="font-medium text-foreground">Total Cost</span>
            </div>
            <span className="text-xl font-bold text-accent">{credits} credits</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={onConfirm}
            className="gap-2"
            data-api="/api/user/action"
            data-body={`{"mode": "${mode}", "credits": ${credits}, "hasImage": ${hasImage}}`}
          >
            <Sparkles className="h-4 w-4" />
            Confirm — Use {credits} credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
