import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Crown, Gem, Shield, CreditCard, HelpCircle, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Pro",
    tier: "pro",
    monthlyPrice: 25,
    yearlyPrice: 21,
    credits: "100",
    icon: Zap,
    description: "Perfect voor casual daters",
    features: [
      { text: "100 credits/dag", included: true },
      { text: "Intent & tone analyse", included: true },
      { text: "3 reply templates", included: true },
      { text: "Chat geschiedenis", included: true },
      { text: "Prioriteit support", included: false },
      { text: "Geavanceerde analyses", included: false },
      { text: "Profiel analyse", included: false },
      { text: "1-op-1 advies", included: false },
    ],
    popular: false,
  },
  {
    name: "Max",
    tier: "max",
    monthlyPrice: 35,
    yearlyPrice: 29,
    credits: "200",
    icon: Crown,
    description: "Voor serieuze daters",
    features: [
      { text: "200 credits/dag", included: true },
      { text: "Intent & tone analyse", included: true },
      { text: "3 reply templates", included: true },
      { text: "Chat geschiedenis", included: true },
      { text: "Prioriteit support", included: true },
      { text: "Geavanceerde analyses", included: true },
      { text: "Profiel analyse", included: false },
      { text: "1-op-1 advies", included: false },
    ],
    popular: true,
  },
  {
    name: "VIP",
    tier: "vip",
    monthlyPrice: 50,
    yearlyPrice: 42,
    credits: "300",
    icon: Gem,
    description: "Maximale resultaten",
    features: [
      { text: "300 credits/dag", included: true },
      { text: "Intent & tone analyse", included: true },
      { text: "3 reply templates", included: true },
      { text: "Chat geschiedenis", included: true },
      { text: "Prioriteit support", included: true },
      { text: "Geavanceerde analyses", included: true },
      { text: "Profiel analyse (beta)", included: true },
      { text: "1-op-1 advies sessie", included: true },
    ],
    popular: false,
  },
];

const billingFaqs = [
  {
    question: "Wat kan ik doen met mijn credits?",
    answer: "5 credits = 1 tekstanalyse, 20 credits = 1 lange chat analyse, 50 credits = 1 screenshot analyse (met OCR). Met 100 credits/dag kun je dus ~20 korte chats analyseren.",
  },
  {
    question: "Worden ongebruikte credits overgezet?",
    answer: "Dagelijkse credits worden om middernacht gereset en niet overgezet. Dit zorgt voor eerlijk gebruik en houdt de service snel.",
  },
  {
    question: "Kan ik tussentijds upgraden of downgraden?",
    answer: "Ja, je kunt op elk moment je plan wijzigen. Bij een upgrade krijg je direct toegang tot meer credits. Bij een downgrade gaat dit in aan het einde van je huidige periode.",
  },
  {
    question: "Hoe werkt de geld-terug garantie?",
    answer: "Binnen 14 dagen na je eerste betaling kun je je geld volledig terugvragen, geen vragen gesteld. Stuur een mail naar support en we regelen het.",
  },
  {
    question: "Welke betaalmethodes accepteren jullie?",
    answer: "We accepteren alle grote creditcards (Visa, Mastercard, Amex), iDEAL, Bancontact, en meer via onze payment provider Stripe.",
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Login vereist",
        description: "Log eerst in om een abonnement te starten.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setLoadingTier(tier);

    try {
      const response = await api.subscribe(tier, isYearly ? 'year' : 'month');
      
      // If we have a client_secret, we need to handle Stripe payment
      // For now, show success message
      toast({
        title: "Abonnement gestart!",
        description: `Je ${tier} abonnement is geactiveerd.`,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast({
        title: "Fout",
        description: error.message || "Kon abonnement niet starten. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-hero">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display text-primary-foreground mb-4">
              Simpele, transparante pricing
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8">
              Kies het plan dat bij jou past. Alle plannen met 14 dagen geld-terug garantie.
            </p>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`font-medium ${!isYearly ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>
                Maandelijks
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`font-medium ${isYearly ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>
                Jaarlijks
              </span>
              {isYearly && (
                <span className="bg-success text-success-foreground text-xs font-bold px-2 py-1 rounded-full">
                  2 maanden gratis
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 -mt-8">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground shadow-xl scale-105 z-10'
                    : 'bg-card border border-border shadow-card'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Meest gekozen
                  </span>
                )}

                <div className={`w-12 h-12 rounded-xl ${
                  plan.popular ? 'bg-primary-foreground/20' : 'bg-accent/10'
                } flex items-center justify-center mb-4`}>
                  <plan.icon className={`h-6 w-6 ${
                    plan.popular ? 'text-primary-foreground' : 'text-accent'
                  }`} />
                </div>

                <h3 className="text-2xl font-bold font-display mb-1">{plan.name}</h3>
                <p className={`text-sm mb-4 ${
                  plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold font-display">
                    €{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={`${
                    plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>/maand</span>
                  {isYearly && (
                    <p className={`text-sm mt-1 ${
                      plan.popular ? 'text-primary-foreground/50' : 'text-muted-foreground'
                    }`}>
                      €{plan.yearlyPrice * 12}/jaar gefactureerd
                    </p>
                  )}
                </div>

                <div className={`flex items-center gap-2 mb-6 p-3 rounded-lg ${
                  plan.popular ? 'bg-primary-foreground/10' : 'bg-accent/5'
                }`}>
                  <Zap className={`h-4 w-4 ${plan.popular ? 'text-secondary' : 'text-accent'}`} />
                  <span className="font-semibold">{plan.credits} credits/dag</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        feature.included
                          ? plan.popular ? 'text-secondary' : 'text-success'
                          : 'text-muted-foreground/30'
                      }`} />
                      <span className={!feature.included ? 'text-muted-foreground/50' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loadingTier !== null}
                >
                  {loadingTier === plan.tier ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verwerken...
                    </>
                  ) : (
                    `Start met ${plan.name}`
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Vergelijk alle features
          </h2>
          
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4 font-semibold text-foreground">Pro</th>
                  <th className="text-center p-4 font-semibold text-accent bg-accent/5">Max</th>
                  <th className="text-center p-4 font-semibold text-foreground">VIP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Dagelijkse credits</td>
                  <td className="p-4 text-center font-medium">100</td>
                  <td className="p-4 text-center font-medium bg-accent/5">200</td>
                  <td className="p-4 text-center font-medium">300</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Intent & tone analyse</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center bg-accent/5"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Reply templates</td>
                  <td className="p-4 text-center">3</td>
                  <td className="p-4 text-center bg-accent/5">3</td>
                  <td className="p-4 text-center">3+</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Prioriteit support</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center bg-accent/5"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Geavanceerde analyses</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center bg-accent/5"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 text-muted-foreground">Profiel analyse</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center bg-accent/5 text-muted-foreground">—</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-muted-foreground">1-op-1 advies sessie</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center bg-accent/5 text-muted-foreground">—</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
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
              <span>14 dagen geld-terug</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-5 w-5 text-accent" />
              <span>Veilig via Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="h-5 w-5 text-secondary" />
              <span>Cancel wanneer je wilt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Veelgestelde vragen over billing
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
