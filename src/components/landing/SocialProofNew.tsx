import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sam",
    age: 26,
    location: "Antwerp",
    text: "Gave me a clear read without the drama. I know exactly when someone's stringing me along now."
  },
  {
    name: "Maya",
    age: 29,
    location: "Rotterdam",
    text: "Snapshot mode was enough for most chats. When things got weird, I switched to Deep and everything made sense."
  },
  {
    name: "Leo",
    age: 33,
    location: "Utrecht",
    text: "Deep mode mapped out the whole conversation in a way I never saw myself. Worth every credit."
  }
];

export const SocialProof = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4" style={{ background: "#07090F" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xl sm:text-2xl font-medium" style={{ color: "#E9ECF5" }}>
            Used by people who want clarity fast
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-6 rounded-xl border"
              style={{
                background: "#0D1018",
                borderColor: "#1A2233"
              }}
            >
              <Quote className="w-10 h-10 mb-4 opacity-30" style={{ color: "#5CE1E6" }} />
              <p className="text-base leading-relaxed mb-6" style={{ color: "#E9ECF5" }}>
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)" }} />
                <div>
                  <p className="font-medium" style={{ color: "#E9ECF5" }}>
                    {testimonial.name}, {testimonial.age}
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-sm"
          style={{ color: "#6B7280" }}
        >
          Privacy-first. Analyses are encrypted and never sold. Delete anytime.
        </motion.p>
      </div>
    </section>
  );
};
