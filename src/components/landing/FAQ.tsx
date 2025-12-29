import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my data safe and private?",
    answer: "Absolutely. All chats are encrypted and never shared with third parties. We are fully GDPR compliant and you can delete your data at any time.",
  },
  {
    question: "How many credits does an analysis cost?",
    answer: "A standard text analysis costs 5 credits. A screenshot analysis (with OCR) costs 10 credits. Profile photo analysis costs 25 credits. With 100 credits/day you can analyze around 20 short chats.",
  },
  {
    question: "Does it work with all dating apps?",
    answer: "Yes! Paste text or upload screenshots from any app: Tinder, Bumble, Hinge, Instagram DMs, WhatsApp, and more.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Of course. You can cancel anytime in your account settings. You keep access to your plan until the end of the billing period.",
  },
  {
    question: "What if I'm not satisfied?",
    answer: "We offer a 14-day money-back guarantee, no questions asked. If you're not happy, you'll get a full refund.",
  },
  {
    question: "How fast do I get an analysis?",
    answer: "Analyses are usually ready within 5-10 seconds. During peak times it can take a bit longer, but never more than 30 seconds.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-accent/10 text-accent px-5 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <HelpCircle className="h-4 w-4" />
            FAQ
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-2xl px-6 data-[state=open]:shadow-card-hover transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-accent transition-colors py-6 text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
