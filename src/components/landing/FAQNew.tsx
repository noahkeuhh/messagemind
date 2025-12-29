import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's included in the free plan?",
    answer: "1 Snapshot analysis per month. No card required. You can upgrade or buy top-up credits anytime."
  },
  {
    question: "What's the difference between Snapshot, Expanded, and Deep?",
    answer: "Snapshot gives you intent, tone, risk, timing, and 3 replies. Expanded adds deeper context and more reply styles. Deep includes full conversation mapping, pattern analysis, and strategic advice."
  },
  {
    question: "Can I analyze screenshots?",
    answer: "Yes. Upload a screenshot of the chat. Works on Plus and Max plans (Expanded/Deep modes)."
  },
  {
    question: "Is my data stored? How private is this?",
    answer: "Your analyses are encrypted and stored only for your history. You can delete them anytime. We never sell data or use it for training."
  },
  {
    question: "What if the analysis is wrong?",
    answer: "AI isn't perfect. Use it as one input, not the only answer. If something feels off, trust your gut. You can also try Deep mode for more context."
  },
  {
    question: "How do credits work?",
    answer: "Each plan gives you monthly credits. Snapshot costs 1 credit (free on Pro), Expanded costs 3-10 credits depending on plan, Deep costs 15-30 credits. Unused credits don't roll over."
  },
  {
    question: "Can I buy extra credits?",
    answer: "Yes. All paid plans can buy top-ups: €5 for 50 credits or €9.99 for 100 credits."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel from your account settings. You keep access until the end of your billing period."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#07090F" }}>
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#E9ECF5" }}>
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border px-6"
                style={{
                  background: "#0D1018",
                  borderColor: "#1A2233"
                }}
              >
                <AccordionTrigger
                  className="text-left font-semibold hover:no-underline"
                  style={{ color: "#E9ECF5" }}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent style={{ color: "#A7B1C5" }}>
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
