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
    question: "Is mijn data veilig en privé?",
    answer: "Absoluut. Al je chats worden versleuteld opgeslagen en worden nooit gedeeld met derden. We zijn volledig GDPR-compliant en je kunt je data op elk moment verwijderen.",
  },
  {
    question: "Hoeveel credits kost een analyse?",
    answer: "Een standaard tekstanalyse kost 5 credits. Een screenshot-analyse (met OCR) kost 10 credits. Profielfoto-analyse kost 25 credits. Met 100 credits/dag kun je ongeveer 20 korte chats analyseren.",
  },
  {
    question: "Werkt het met alle dating apps?",
    answer: "Ja! Je kunt tekst plakken of screenshots uploaden van elke app: Tinder, Bumble, Hinge, Instagram DMs, WhatsApp, en meer.",
  },
  {
    question: "Kan ik mijn abonnement opzeggen?",
    answer: "Natuurlijk. Je kunt op elk moment opzeggen via je account instellingen. Je houdt toegang tot je plan tot het einde van de betaalperiode.",
  },
  {
    question: "Wat als ik niet tevreden ben?",
    answer: "We bieden een 14-dagen geld-terug garantie, geen vragen gesteld. Als je niet tevreden bent, krijg je je geld volledig terug.",
  },
  {
    question: "Hoe snel krijg ik een analyse?",
    answer: "Analyses zijn meestal binnen 5-10 seconden klaar. Bij drukte kan dit iets langer duren, maar nooit meer dan 30 seconden.",
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
            Veelgestelde vragen
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
