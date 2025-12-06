import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { X, Heart, Mail, Lock, Tag, Loader2 } from "lucide-react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SignupModal = ({ isOpen, onClose, onSuccess }: SignupModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    promoCode: "",
    acceptTos: false,
  });
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTos) {
      toast({
        title: "Fout",
        description: "Je moet de voorwaarden accepteren",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Fout",
        description: "Wachtwoord moet minimaal 6 tekens lang zijn",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(formData.email, formData.password);
      
      // Wait for auth state to update (auth context will update via onAuthStateChange)
      // Wait a bit longer to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast({
        title: "Account aangemaakt!",
        description: "Welkom bij AI Flirt Studio. Je account is aangemaakt.",
      });
      
      onClose();
      
      // Use onSuccess callback if provided, otherwise navigate
      if (onSuccess) {
        onSuccess();
      } else {
        // Use replace to prevent back button issues
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Fout",
        description: error.message || "Kon account niet aanmaken. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-hero p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Heart className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-primary-foreground">
                    Maak account aan
                  </h2>
                  <p className="text-primary-foreground/70 text-sm">
                    Start je eerste analyse gratis
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jouw@email.nl"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimaal 6 tekens"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoCode">Promocode (optioneel)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="promoCode"
                    type="text"
                    placeholder="PROMO2024"
                    className="pl-10"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="tos"
                  checked={formData.acceptTos}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTos: checked as boolean })}
                  disabled={isLoading}
                />
                <Label htmlFor="tos" className="text-sm cursor-pointer">
                  Ik accepteer de{" "}
                  <a href="/terms" className="text-accent hover:underline">
                    voorwaarden
                  </a>{" "}
                  en{" "}
                  <a href="/privacy" className="text-accent hover:underline">
                    privacybeleid
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading || !formData.acceptTos}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Account aanmaken...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Account aanmaken
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
