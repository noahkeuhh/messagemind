import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: Check environment variables
console.log('🔍 Environment Check:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found!");
}

createRoot(rootElement).render(<App />);
