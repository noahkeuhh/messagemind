import { motion } from "framer-motion";
import { Star, Quote, TrendingUp, Users, MessageSquare, Zap } from "lucide-react";

const stats = [
  { value: "1,000+", label: "Active users", icon: Users, color: "from-accent to-rose-500" },
  { value: "85%", label: "More dates", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
  { value: "50K+", label: "Chats analyzed", icon: MessageSquare, color: "from-violet-500 to-purple-600" },
  { value: "4.8/5", label: "User rating", icon: Star, color: "from-amber-500 to-orange-500" },
];

const testimonials = [
  {
    quote: "I finally get what she means. The replies are spot on!",
    author: "Mark, 28",
    role: "Software Developer",
    rating: 5,
    avatar: "M",
  },
  {
    quote: "From awkward texts to smooth conversations. Game changer.",
    author: "Thomas, 32",
    role: "Sales Manager",
    rating: 5,
    avatar: "T",
  },
  {
    quote: "The AI catches nuances I miss myself. It became indispensable.",
    author: "Jasper, 25",
    role: "Marketing Specialist",
    rating: 5,
    avatar: "J",
  },
];

export const SocialProof = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      
      <div className="container relative">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="text-center p-8 rounded-3xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl md:text-5xl font-bold font-display text-foreground mb-2">
                {stat.value}
              </p>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
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
            <Zap className="h-4 w-4" />
            Testimonials
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6">
            What users say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thousands use MessageMind to get clarity on their conversations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-3xl p-8 border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 group"
            >
              {/* Quote icon */}
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Quote className="h-6 w-6 text-accent" />
              </div>
              
              <p className="text-foreground text-lg mb-8 leading-relaxed">"{testimonial.quote}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
