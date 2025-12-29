import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export const Footer = () => {
  const links = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <footer className="py-12 border-t" style={{ background: "#07090F", borderColor: "#1A2233" }}>
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" style={{ color: "#5CE1E6" }} />
            <span 
              className="text-lg font-bold"
              style={{ 
                background: "linear-gradient(135deg, #5CE1E6 0%, #7A7CFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              MessageMind
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm hover:text-[#5CE1E6] transition-colors"
                style={{ color: "#A7B1C5" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "#6B7280" }}>
            © 2025 MessageMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
