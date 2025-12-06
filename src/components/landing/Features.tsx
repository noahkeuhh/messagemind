import { motion } from "framer-motion";
import { 
  Brain, 
  MessageSquare, 
  Clock, 
  Shield, 
  Bookmark, 
  History,
  Sparkles,
  Target
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Intent Detectie",
    description: "Begrijp wat ze écht bedoelt, niet wat ze zegt. Onze AI leest tussen de regels.",
    color: "from-violet-500 to-purple-600",
    highlight: true,
  },
  {
    icon: Target,
    title: "Tone Score",
    description: "Zie direct hoe geïnteresseerd ze is met een score van 0-100.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageSquare,
    title: "Reply Templates",
    description: "3 perfect afgestemde antwoorden: Direct, Speels, of Confident.",
    color: "from-accent to-rose-500",
  },
  {
    icon: Clock,
    title: "Timing Advies",
    description: "Weet precies wanneer je moet reageren voor maximale impact.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "Profiel Analyse",
    description: "Upload haar profielfoto voor stijl- en gespreksadvies.",
    color: "from-amber-500 to-orange-500",
    comingSoon: true,
  },
  {
    icon: Bookmark,
    title: "Opslaan & Hergebruiken",
    description: "Sla je beste antwoorden op voor later gebruik.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: History,
    title: "Chat Geschiedenis",
    description: "Bekijk al je eerdere analyses en leer van je succes.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Shield,
    title: "100% Privacy",
    description: "Je chats worden versleuteld en nooit gedeeld. GDPR compliant.",
    color: "from-slate-500 to-gray-600",
  },
];

export const Features = () => {
  return (
    <section id="features" className="section-padding bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      
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
            Features
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Krachtige tools om elk gesprek naar een hoger niveau te tillen
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className={`group relative bg-card rounded-3xl p-7 border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 ${
                feature.highlight ? 'ring-2 ring-accent/20 ring-offset-2 ring-offset-background' : ''
              }`}
            >
              {feature.comingSoon && (
                <span className="absolute top-5 right-5 text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                  Soon
                </span>
              )}
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              
              <h3 className="font-bold text-foreground text-lg mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
