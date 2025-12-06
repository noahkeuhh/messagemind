import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { SignupModal } from "@/components/modals/SignupModal";
import { LoginModal } from "@/components/modals/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

const IndexContent = () => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    // Use replace to prevent redirect loops
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* SEO Meta - would be in head via react-helmet */}
      <title>AI Flirt Translator - Decodeer haar berichten & krijg perfecte antwoorden</title>
      
      <Navbar 
        onSignupClick={() => setIsSignupOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
      />
      <Hero 
        onSignupClick={() => setIsSignupOpen(true)}
        onPricingClick={() => navigate("/pricing")}
      />
      <SocialProof />
      <HowItWorks />
      <Features />
      <PricingTeaser 
        onSubscribeClick={(tier: string) => {
          if (user) {
            navigate("/pricing");
          } else {
            setIsSignupOpen(true);
          }
        }}
      />
      <FAQ />
      <Footer />
      
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)}
        onSuccess={handleSignupSuccess}
      />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleSignupSuccess}
      />
    </main>
  );
};

const Index = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <IndexContent />
    </ProtectedRoute>
  );
};

export default Index;
