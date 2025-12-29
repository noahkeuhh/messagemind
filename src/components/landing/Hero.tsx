import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Star, Users, MessageSquare, Sparkles, Play } from "lucide-react";

interface HeroProps {
  onSignupClick?: () => void;
  onPricingClick?: () => void;
}

export const Hero = ({ onSignupClick, onPricingClick }: HeroProps) => {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Neon gradient orbs */}
        <motion.div 
          className="glow-orb top-20 -right-32 w-[500px] h-[500px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="glow-orb bottom-20 -left-32 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{ background: 'radial-gradient(circle, hsl(270 80% 65% / 0.08) 0%, transparent 70%)' }}
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid pattern with neon glow */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--accent) / 0.08) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container relative z-10 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 badge-neon px-5 py-2.5 mb-8"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Dating Assistant</span>
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-8">
              Never guess{" "}
              <span className="relative">
                <span className="text-gradient">what she means again.</span>
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 10"
                  fill="none"
                >
                  <path
                    d="M2 8c50-5 100-5 196-2"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                </motion.svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload a chat or paste a message - within seconds you get what she really means plus three ready-to-send replies.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={onSignupClick}
              >
                Try for free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="hero-outline" 
                size="xl"
                onClick={onPricingClick}
                className="group"
              >
                <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Watch demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <span>100% Privacy</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <Star className="h-4 w-4 text-warning" />
                </div>
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <span>1,000+ users</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Demo card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Main demo card */}
            <div className="relative card-glass rounded-3xl p-8">
              {/* Demo header */}
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-accent">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                  <div>
                    <p className="font-semibold text-white text-lg">Chat Analysis</p>
                    <p className="text-sm text-white/50">Live demo</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-success/20 text-success text-sm font-medium rounded-full border border-success/20">
                  Active
                </span>
              </div>

              {/* Input message */}
              <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/5">
                <p className="text-sm text-white/40 mb-2 font-medium">Her message:</p>
                <p className="text-white/90 text-lg">"Haha yeah maybe, we'll see 😊"</p>
              </div>

              {/* AI Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-accent/15 rounded-2xl p-4 text-center border border-accent/30">
                    <p className="text-xs text-white/40 mb-1.5 font-medium">Intent</p>
                    <p className="font-bold text-accent">Interested</p>
                  </div>
                  <div className="bg-success/15 rounded-2xl p-4 text-center border border-success/30">
                    <p className="text-xs text-white/40 mb-1.5 font-medium">Tone</p>
                    <p className="font-bold text-success">Playful</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                    <p className="text-xs text-white/40 mb-1.5 font-medium">Score</p>
                    <p className="font-bold text-white">78/100</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-xs text-white/40 mb-3 font-medium">Suggested reply:</p>
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 rounded-2xl p-4">
                    <p className="text-white/90">"No maybe - let's meet Friday at 8 at [spot]. First round is on me. 🍷"</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-gradient-to-br from-success to-primary text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold border border-white/20 shadow-accent"
            >
              +85% match rate ✨
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 card-glass text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <span className="text-accent">★★★★★</span> 4.9/5 rating
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};
