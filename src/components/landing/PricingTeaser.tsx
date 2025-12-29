import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Gem, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PricingTeaserProps {
  onSubscribeClick?: (tier: string) => void;
}

const plans = [
  {
    name: "Pro",
    tier: "pro",
    price: "25",
    credits: "100",
    icon: Zap,
    description: "Enough for 20 short chats per day",
    features: [
      "100 credits/day",
      "Intent & tone analysis",
      "3 reply templates",
      "Chat history",
    ],
    popular: false,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Max",
    tier: "max",
    price: "35",
    credits: "200",
    icon: Crown,
    description: "Double the freedom + priority support",
    features: [
      "200 credits/day",
      "Everything in Pro",
      "Priority support",
      "Advanced analyses",
    ],
    popular: true,
    color: "from-accent to-rose-500",
  },
  {
    name: "VIP",
    tier: "vip",
    price: "50",
    credits: "300",
    icon: Gem,
    description: "Unlimited potential + exclusive content",
    features: [
      "300 credits/day",
      "Everything in Max",
      "Exclusive content",
      "1-on-1 coaching session",
    ],
    popular: false,
    color: "from-violet-500 to-purple-600",
  },
];

export const PricingTeaser = ({ onSubscribeClick }: PricingTeaserProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribe = (tier: string) => {
    if (onSubscribeClick) {
      onSubscribeClick(tier);
    } else if (user) {
      navigate("/pricing");
    } else {
      navigate("/");
    }
  };

  return (
    <section className="section-padding bg-gradient-subtle relative overflow-hidden" id="pricing">
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-accent/10 text-accent px-5 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4" />
            Pricing
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6">
            Choose your plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start today with better conversations. Every plan comes with a money-back guarantee.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-3xl p-8 transition-all duration-500 ${
                plan.popular
                  ? 'bg-gradient-hero text-white shadow-2xl scale-105 border border-white/10'
                  : 'bg-card border border-border/50 shadow-card hover:shadow-card-hover'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-rose-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                  Most popular
                </span>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                <plan.icon className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold font-display mb-2">{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                {plan.description}
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold font-display">€{plan.price}</span>
                <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>/month</span>
              </div>

              <div className={`flex items-center gap-3 mb-8 p-4 rounded-2xl ${
                plan.popular ? 'bg-white/10' : 'bg-accent/5'
              }`}>
                <Zap className={`h-5 w-5 ${plan.popular ? 'text-amber-400' : 'text-accent'}`} />
                <span className="font-bold text-lg">{plan.credits} credits/day</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      plan.popular ? 'text-amber-400' : 'text-success'
                    }`} />
                    <span className={plan.popular ? 'text-white/90' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe(plan.tier)}
              >
                Start {plan.name}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
