import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, X } from "lucide-react";
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
    { label: "How it works", href: "#how-it-works" },
    { label: "Examples", href: "#examples" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "/contact" },
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
            ? "bg-[#0D1018]/80 backdrop-blur-lg border-b border-[#1A2233]"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <MessageCircle 
                className="w-7 h-7" 
                style={{ color: "#5CE1E6" }}
              />
              <motion.div
                className="absolute inset-0 blur-lg"
                style={{ background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)", opacity: 0.3 }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <span 
              className="text-xl font-bold"
              style={{ 
                background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              MessageMind
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-medium text-[#A7B1C5] hover:text-[#E9ECF5] transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                size="default"
                onClick={() => navigate("/dashboard", { replace: true })}
                style={{
                  background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                  color: "#07090F"
                }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleLogin}
                  className="text-[#A7B1C5] hover:text-[#E9ECF5] hover:bg-[#12151F]"
                >
                  Log in
                </Button>
                <Button
                  size="default"
                  onClick={handleSignup}
                  style={{
                    background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                    color: "#07090F"
                  }}
                >
                  Start free
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2.5 rounded-xl hover:bg-[#12151F] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-[#E9ECF5]" />
            ) : (
              <Menu className="h-6 w-6 text-[#E9ECF5]" />
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
            className="fixed inset-x-0 top-20 z-40 bg-[#0D1018]/95 backdrop-blur-lg border-b border-[#1A2233] shadow-xl md:hidden"
          >
            <div className="container py-8 space-y-6">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="block py-3 font-semibold text-lg text-[#E9ECF5] hover:text-[#5CE1E6] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="pt-6 space-y-3 border-t border-[#1A2233]">
                {user ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      navigate("/dashboard", { replace: true });
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                      color: "#07090F"
                    }}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        handleLogin();
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ borderColor: "#1A2233", color: "#A7B1C5" }}
                    >
                      Log in
                    </Button>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        handleSignup();
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                        color: "#07090F"
                      }}
                    >
                      Start free
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
