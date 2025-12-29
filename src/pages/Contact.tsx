import { useState } from "react";
import { Mail, MessageCircle, Send, MapPin, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/NavbarNew";
import { Footer } from "@/components/landing/FooterNew";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitted(false);
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div style={{ background: "#07090F" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pb-20 lg:pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(180 85% 65%), hsl(248 73% 70%))",
                }}
              >
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
              style={{ color: "#E9ECF5" }}
            >
              Get in touch
            </h1>
            <p
              className="text-lg sm:text-xl max-w-2xl mx-auto"
              style={{ color: "#9BA3B4" }}
            >
              Questions, feedback, or need help? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="pb-16 sm:pb-20 lg:pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div
              className="p-6 sm:p-8 rounded-2xl"
              style={{ background: "#0D1018" }}
            >
              <h2
                className="text-2xl sm:text-3xl font-bold mb-6"
                style={{ color: "#E9ECF5" }}
              >
                Send us a message
              </h2>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: "linear-gradient(135deg, hsl(180 85% 65%), hsl(248 73% 70%))",
                    }}
                  >
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#E9ECF5" }}>
                    Message sent!
                  </h3>
                  <p style={{ color: "#9BA3B4" }}>
                    We'll get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#E9ECF5" }}
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#E9ECF5" }}
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#E9ECF5" }}
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is your message about?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#E9ECF5" }}
                    >
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what you'd like to know..."
                      className="w-full min-h-[150px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full gap-2"
                    style={{
                      background: isSubmitting
                        ? "#666"
                        : "linear-gradient(135deg, hsl(180 85% 65%), hsl(248 73% 70%))",
                    }}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div
                className="p-6 sm:p-8 rounded-2xl"
                style={{ background: "#0D1018" }}
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#E9ECF5" }}
                >
                  Contact information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(92, 225, 230, 0.1)" }}
                    >
                      <Mail className="h-5 w-5" style={{ color: "#5CE1E6" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#E9ECF5" }}>
                        Email
                      </p>
                      <a
                        href="mailto:support@messagemind.nl"
                        className="text-sm hover:underline"
                        style={{ color: "#9BA3B4" }}
                      >
                        support@messagemind.nl
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(122, 124, 255, 0.1)" }}
                    >
                      <Phone className="h-5 w-5" style={{ color: "#7A7CFF" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#E9ECF5" }}>
                        Phone
                      </p>
                      <p className="text-sm" style={{ color: "#9BA3B4" }}>
                        +31 (0)20 123 4567
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(92, 225, 230, 0.1)" }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: "#5CE1E6" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#E9ECF5" }}>
                        Address
                      </p>
                      <p className="text-sm" style={{ color: "#9BA3B4" }}>
                        Amsterdam, Netherlands
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="p-6 sm:p-8 rounded-2xl"
                style={{ background: "#0D1018" }}
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#E9ECF5" }}
                >
                  Frequently asked questions
                </h3>
                <p className="text-sm mb-4" style={{ color: "#9BA3B4" }}>
                  Find answers to the most common questions on our FAQ page.
                </p>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/#faq")}
                  className="w-full"
                >
                  View FAQ
                </Button>
              </div>

              <div
                className="p-6 sm:p-8 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(92, 225, 230, 0.1), rgba(122, 124, 255, 0.1))",
                }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#E9ECF5" }}
                >
                  Quick response
                </h3>
                <p className="text-sm" style={{ color: "#9BA3B4" }}>
                  We respond to all messages within 24 hours. For urgent questions,
                  call us during business hours (9:00 AM - 5:00 PM).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
