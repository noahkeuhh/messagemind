import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Twitter, Instagram, Linkedin, Loader2, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email vereist",
        description: "Voer een email adres in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      toast({
        title: "Aangemeld!",
        description: "Je bent aangemeld voor onze nieuwsbrief.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <footer className="bg-gradient-hero text-white pt-20 pb-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-rose-500 flex items-center justify-center shadow-lg shadow-accent/25">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-display">AI Flirt Translator</span>
            </div>
            <p className="text-white/60 mb-8 max-w-sm leading-relaxed text-lg">
              Decodeer haar berichten en krijg perfecte antwoorden. Nooit meer raden wat ze bedoelt.
            </p>
            
            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md">
              <Input
                type="email"
                placeholder="Je email adres"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
                disabled={isLoading}
                required
              />
              <Button variant="hero" size="default" type="submit" disabled={isLoading} className="h-12 px-6">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4 text-white/60">
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-accent transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-accent transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-accent transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-white/60">
              <li>
                <a href="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/refund" className="hover:text-accent transition-colors">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="mailto:support@example.com" className="hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Privacy note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-12 border border-white/10"
        >
          <div className="flex items-center gap-3 justify-center">
            <Shield className="h-5 w-5 text-success" />
            <p className="text-white/70">
              <strong className="text-white">Privacy first:</strong> Je chats en afbeeldingen blijven privé — we delen nooit je data.
            </p>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm mb-6 md:mb-0">
            © 2024 AI Flirt Translator. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: Twitter, href: "https://twitter.com" },
              { icon: Instagram, href: "https://instagram.com" },
              { icon: Linkedin, href: "https://linkedin.com" },
              { icon: Mail, href: "mailto:support@example.com" },
            ].map((social, index) => (
              <a 
                key={index}
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-accent hover:bg-white/10 transition-all"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
