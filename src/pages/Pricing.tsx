import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Crown, Gem, Shield, CreditCard, HelpCircle, Loader2, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Free",
    tier: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: "1 analysis",
    icon: Shield,
    description: "Test the app",
    features: [
      { text: "1 free analysis", included: true },
      { text: "Basic text analysis", included: true },
      { text: "Intent & tone detection", included: true },
      { text: "2 response options", included: true },
      { text: "Expanded analysis", included: false },
      { text: "Image analysis", included: false },
      { text: "Chat history", included: false },
    ],
    popular: false,
  },
  {
    name: "Pro",
    tier: "pro",
    monthlyPrice: 17,
    yearlyPrice: 15,
    credits: "100/day",
    icon: Zap,
    description: "For regular use",
    features: [
      { text: "100 credits per day", included: true },
      { text: "Basic & expanded analysis", included: true },
      { text: "Multiple response options", included: true },
      { text: "Chat history", included: true },
      { text: "Fast response time", included: true },
      { text: "Image analysis", included: false },
      { text: "Deep analysis", included: false },
    ],
    popular: false,
  },
  {
    name: "Plus",
    tier: "plus",
    monthlyPrice: 29,
    yearlyPrice: 26,
    credits: "180/day",
    icon: Crown,
    description: "For serious users",
    features: [
      { text: "180 credits per day", included: true },
      { text: "All analysis modes", included: true },
      { text: "Image analysis included", included: true },
      { text: "Deep analysis option", included: true },
      { text: "Extended detail depth", included: true },
      { text: "Chat history", included: true },
      { text: "Priority support", included: false },
    ],
    popular: false,
  },
  {
    name: "Max",
    tier: "max",
    monthlyPrice: 59,
    yearlyPrice: 53,
    credits: "300/day",
    icon: Gem,
    description: "Maximum capabilities",
    features: [
      { text: "300 credits per day", included: true },
      { text: "All analysis modes", included: true },
      { text: "Full deep analysis", included: true },
      { text: "Image analysis included", included: true },
      { text: "Conversation flow simulations", included: true },
      { text: "Chat history", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
    popular: true,
  },
];

const billingFaqs = [
  {
    question: "What can I do with my credits?",
    answer: "Short text analysis costs 5 credits, long text 12 credits, and image analysis 30 credits. Deep analysis (Max tier) costs slightly more. With 100 credits per day, you can do many analyses.",
  },
  {
    question: "What's the difference between subscriptions?",
    answer: "Free: 1 free analysis to test. Pro: 100 credits/day for regular use. Plus: 180 credits/day with images. Max: 300 credits/day with advanced analyses and priority support.",
  },
  {
    question: "What is deep analysis?",
    answer: "Deep analysis (Max tier only) offers detailed conversation flow simulations, escalation advice, and risk detection. The output is much more comprehensive than standard analyses.",
  },
  {
    question: "Are unused credits carried over?",
    answer: "No, daily credits reset every night at 00:00 and are not carried over. This ensures fair usage.",
  },
  {
    question: "Can I upgrade or downgrade?",
    answer: "Yes, you can always switch plans. With an upgrade, you get immediate access to more credits. With a downgrade, this takes effect at the end of your current period.",
  },
  {
    question: "How does the money-back guarantee work?",
    answer: "Within 14 days of your first payment, you get a full refund, no questions asked. Send an email to support and we'll take care of it.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, Amex), iDEAL, Bancontact and more via our payment provider Stripe.",
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loadingCurrentTier, setLoadingCurrentTier] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch current subscription tier
  const fetchCurrentTier = async () => {
    if (!user) {
      setLoadingCurrentTier(false);
      return;
    }
    
    try {
      const credits = await api.getCredits();
      setCurrentTier(credits.subscription_tier || 'free');
    } catch (error) {
      console.error('Error fetching current tier:', error);
      setCurrentTier('free');
    } finally {
      setLoadingCurrentTier(false);
    }
  };

  // Load current tier on mount
  useEffect(() => {
    fetchCurrentTier();
  }, [user]);

  const getTierIndex = (tier: string) => {
    const tiers = ['free', 'pro', 'plus', 'max'];
    return tiers.indexOf(tier);
  };

  const getButtonText = (planTier: string) => {
    if (!currentTier) return `Start with ${planTier}`;
    
    const currentIndex = getTierIndex(currentTier);
    const planIndex = getTierIndex(planTier);
    
    if (currentIndex === planIndex) {
      return 'Current plan';
    } else if (planIndex > currentIndex) {
      return 'Upgrade';
    } else {
      return 'Downgrade';
    }
  };

  const isCurrentPlan = (planTier: string) => {
    return currentTier === planTier;
  };


  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in first to start a subscription.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Prevent subscribing to current plan
    if (isCurrentPlan(tier)) {
      toast({
        title: "Already subscribed",
        description: "You are already on this plan.",
      });
      return;
    }

    setLoadingTier(tier);

    try {
      const response = await api.subscribe(tier, isYearly ? 'year' : 'month');
      
      // Redirect to Stripe Checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not start subscription. Please try again.",
        variant: "destructive",
      });
      setLoadingTier(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-hero relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl bg-accent/20" />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl bg-primary/20" />
        </div>
        <div className="container text-center relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-4">
              Simple, transparent
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Choose the plan that fits you. All plans come with a 14-day money-back guarantee.
            </p>
            
            {/* Billing toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <span className={`font-medium text-sm sm:text-base ${
                  !isYearly ? 'text-white' : 'text-white/50'
                }`}>
                  Monthly
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                <span className={`font-medium text-sm sm:text-base ${
                  isYearly ? 'text-white' : 'text-white/50'
                }`}>
                  Yearly
                </span>
              </div>
              {isYearly && (
                <span className="bg-success text-success-foreground text-xs font-bold px-2 py-1 rounded-full shadow-accent">
                  2 months free
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-12 sm:py-16 -mt-8">
        <div className="container px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isCurrent = isCurrentPlan(plan.tier);
              return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-500 ${
                  isCurrent
                    ? 'card-glass border-2 border-primary/60 shadow-xl ring-2 ring-primary/30'
                    : plan.popular
                    ? 'card-glass border-2 border-accent/40 shadow-xl lg:scale-105 z-10 hover:border-accent/70 hover:shadow-accent'
                    : 'card-elevated'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    Your plan
                  </span>
                )}
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge-neon text-xs font-bold px-4 py-1">
                    Most popular
                  </span>
                )}

                <div className={`w-12 h-12 rounded-xl ${
                  plan.popular ? 'bg-accent/15 border border-accent/40' : 'bg-primary/15 border border-primary/25'
                } flex items-center justify-center mb-4`}>
                  <plan.icon className={`h-6 w-6 ${
                    plan.popular ? 'text-accent' : 'text-primary'
                  }`} />
                </div>

                <h3 className="text-2xl font-bold font-display mb-1">{plan.name}</h3>
                <p className="text-sm mb-4 text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold font-display">
                    €{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      €{plan.yearlyPrice * 12}/year billed
                    </p>
                  )}
                </div>

                <div className={`flex items-center gap-2 mb-6 p-3 rounded-lg border ${
                  plan.popular ? 'bg-accent/15 border-accent/30' : 'bg-primary/10 border-primary/25'
                }`}>
                  <Zap className={`h-4 w-4 ${plan.popular ? 'text-accent' : 'text-primary'}`} />
                  <span className="font-semibold">{plan.credits}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        feature.included
                          ? 'text-success'
                          : 'text-muted-foreground/30'
                      }`} />
                      <span className={!feature.included ? 'text-muted-foreground/50' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrent ? "default" : plan.popular ? "hero" : "hero-outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loadingTier !== null || isCurrent}
                >
                  {loadingTier === plan.tier ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    getButtonText(plan.tier)
                  )}
                </Button>
              </motion.div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-4xl px-4">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Compare all features
          </h2>
          
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4 font-semibold text-foreground">Free</th>
                  <th className="text-center p-4 font-semibold text-foreground">Pro</th>
                  <th className="text-center p-4 font-semibold text-foreground">Plus</th>
                  <th className="text-center p-4 font-semibold text-accent bg-accent/15 border border-accent/30">Max</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Daily credits</td>
                  <td className="p-4 text-center font-medium">1 total</td>
                  <td className="p-4 text-center font-medium">100</td>
                  <td className="p-4 text-center font-medium">180</td>
                  <td className="p-4 text-center font-medium bg-accent/10 border border-accent/20">300</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Basic analysis</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Expanded analysis</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Deep analysis</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Image analysis</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Chat history</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-muted-foreground">Priority support</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-destructive/30 mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/10 border border-accent/20"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-success" />
              <span>14-day money back</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-5 w-5 text-accent" />
              <span>Secure via Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="h-5 w-5 text-secondary" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl px-4">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Frequently asked questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            {billingFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-card transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-accent transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Pricing;
