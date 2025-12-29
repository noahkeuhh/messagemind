import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/landing/NavbarNew";
import { Hero } from "@/components/landing/HeroNew";
import { SocialProof } from "@/components/landing/SocialProofNew";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorksNew";
import { Examples } from "@/components/landing/Examples";
import { Features } from "@/components/landing/FeaturesNew";
import { PricingSection } from "@/components/landing/PricingSection";
import { WhyNotChatGPT } from "@/components/landing/WhyNotChatGPT";
import { FAQ } from "@/components/landing/FAQNew";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/FooterNew";
import { SignupModal } from "@/components/modals/SignupModal";
import { LoginModal } from "@/components/modals/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

const LandingContent = () => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#07090F]">
      <title>MessageMind - Stop second-guessing dating messages</title>
      
      <Navbar 
        onSignupClick={() => setIsSignupOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
      />
      
      <Hero onSignupClick={() => setIsSignupOpen(true)} />
      <SocialProof />
      <ProblemSolution />
      <HowItWorks />
      <Examples onSignupClick={() => setIsSignupOpen(true)} />
      <Features />
      <PricingSection onSignupClick={() => user ? navigate("/pricing") : setIsSignupOpen(true)} />
      <WhyNotChatGPT />
      <FAQ />
      <FinalCTA onSignupClick={() => setIsSignupOpen(true)} />
      <Footer />
      
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)}
        onSuccess={handleSignupSuccess}
        onSwitchToLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleSignupSuccess}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />
    </main>
  );
};

const Landing = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <LandingContent />
    </ProtectedRoute>
  );
};

export default Landing;
