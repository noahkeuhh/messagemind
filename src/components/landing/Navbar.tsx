import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, X, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onSignupClick?: () => void;
  onLoginClick?: () => void;
}

export const Navbar = ({ onSignupClick, onLoginClick }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const handleSignup = () => {
    if (onSignupClick) {
      onSignupClick();
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "card-glass border-b border-white/20 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105" style={{ background: "linear-gradient(135deg, hsl(180 85% 65%) 0%, hsl(248 73% 70%) 100%)" }}>
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xl font-bold font-display transition-colors ${
              isScrolled ? "text-foreground" : "text-white"
            }`}>
              MessageMind
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                  className={`font-medium transition-all duration-300 hover:text-accent relative group ${
                  isScrolled ? "text-foreground" : "text-white/90"
                }`}
              >
                {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent rounded-full transition-all duration-300 group-hover:w-full shadow-[0_0_8px_hsl(var(--accent))]" />
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                variant={isScrolled ? "outline" : "hero-outline"}
                size="default"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant={isScrolled ? "ghost" : "hero-outline"}
                  size="default"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
                <Button variant="hero" size="default" onClick={handleSignup}>
                  Try for free
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2.5 rounded-xl transition-colors ${
              isScrolled ? "hover:bg-muted" : "hover:bg-white/10"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? "text-foreground" : "text-white"}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? "text-foreground" : "text-white"}`} />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-20 z-40 card-glass border-b border-white/20 shadow-xl md:hidden"
          >
            <div className="container py-8 space-y-6">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="block py-3 font-semibold text-lg text-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="pt-6 space-y-3 border-t border-border">
                {user ? (
                  <Button variant="hero" className="w-full" size="lg" onClick={() => {
                    navigate("/dashboard", { replace: true });
                    setIsMobileMenuOpen(false);
                  }}>
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" size="lg" onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}>
                      Log in
                    </Button>
                    <Button variant="hero" className="w-full" size="lg" onClick={() => {
                      handleSignup();
                      setIsMobileMenuOpen(false);
                    }}>
                      Try for free
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
