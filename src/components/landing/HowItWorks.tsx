import { motion } from "framer-motion";
import { Upload, Brain, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload of paste",
    description: "Plak haar bericht of upload een screenshot van je chat. Werkt met alle apps.",
    color: "from-accent to-rose-500",
    number: "01",
  },
  {
    icon: Brain,
    title: "AI decodeert",
    description: "Onze AI analyseert intentie, toon, interesse-niveau en verborgen signalen.",
    color: "from-violet-500 to-purple-600",
    number: "02",
  },
  {
    icon: MessageCircle,
    title: "Krijg antwoorden",
    description: "Ontvang 3 kant-en-klare antwoorden + timing advies. Copy, paste, date.",
    color: "from-emerald-500 to-teal-500",
    number: "03",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="section-padding bg-gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-accent/10 text-accent px-5 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4" />
            Simpel proces
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6">
            Hoe het werkt
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In 3 stappen van verwarring naar perfecte antwoorden
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-32 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-accent/20 via-accent to-accent/20" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="bg-card rounded-3xl p-8 lg:p-10 text-center h-full border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 group">
                {/* Step number */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl border-4 border-background`}
                >
                  {step.number}
                </motion.div>
                
                {/* Icon */}
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-8 mt-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold font-display text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {step.description}
                </p>
              </div>
              
              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-32 -right-6 z-10">
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-8 w-8 text-accent" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
