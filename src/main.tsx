import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";
import { init as initAnalytics } from "./lib/analytics";

// Capture UTMs / gclid / fbclid from the landing URL before first render
captureAttribution();
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
