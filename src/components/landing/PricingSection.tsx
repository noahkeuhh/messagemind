import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Pro",
    price: "€17",
    credits: "100 credits",
    period: "per month",
    mode: "Snapshot default",
    features: [
      "100 credits per month",
      "Snapshot mode included",
      "Expanded: 10 credits/use",
      "Deep: 30 credits/use",
      "Buy top-ups: €5/50 or €9.99/100"
    ],
    highlighted: false
  },
  {
    name: "Plus",
    price: "€29",
    credits: "180 credits",
    period: "per month",
    mode: "Expanded included",
    features: [
      "180 credits per month",
      "Snapshot mode: 1 credit",
      "Expanded mode included",
      "Deep: 15 credits/use",
      "Buy top-ups if needed"
    ],
    highlighted: true,
    badge: "Best value"
  },
  {
    name: "Max",
    price: "€59",
    credits: "300 credits",
    period: "per month",
    mode: "Deep included",
    features: [
      "300 credits per month",
      "Snapshot: 1 credit",
      "Expanded: 3 credits",
      "Deep mode included",
      "Priority support"
    ],
    highlighted: false
  }
];

interface PricingSectionProps {
  onSignupClick?: () => void;
}

export const PricingSection = ({ onSignupClick }: PricingSectionProps) => {
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#07090F" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            Simple pricing
          </h2>
          <p className="text-xl" style={{ color: "#A7B1C5" }}>
            Pay for what you use. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-xl border p-8 ${plan.highlighted ? 'transform md:scale-105' : ''}`}
              style={{
                background: plan.highlighted ? "#0D1018" : "#07090F",
                borderColor: plan.highlighted ? "#5CE1E6" : "#1A2233"
              }}
            >
              {plan.badge && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                    color: "#07090F"
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color: "#E9ECF5" }}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold" style={{ color: "#E9ECF5" }}>
                    {plan.price}
                  </span>
                  <span style={{ color: "#6B7280" }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#A7B1C5" }}>
                  {plan.credits} • {plan.mode}
                </p>
              </div>

              <Button
                className="w-full mb-6"
                onClick={onSignupClick}
                style={plan.highlighted ? {
                  background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                  color: "#07090F"
                } : {
                  background: "#12151F",
                  color: "#E9ECF5",
                  borderWidth: "1px",
                  borderColor: "#1A2233"
                }}
              >
                {plan.highlighted ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start with Plus
                  </>
                ) : (
                  `Choose ${plan.name}`
                )}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#5CE1A8" }} />
                    <span className="text-sm" style={{ color: "#A7B1C5" }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-2"
        >
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Free plan: 1 Snapshot analysis per month. No card required.
          </p>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            All paid plans can buy extra credits: €5/50 credits or €9.99/100 credits.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
