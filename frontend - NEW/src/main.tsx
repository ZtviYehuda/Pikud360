import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { DateProvider } from "./context/DateContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { ChatProvider } from "./context/ChatContext";
import { Credits } from "./components/common/Credits";
import { OfflineIndicator } from "./components/common/OfflineIndicator";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <ThemeProvider>
        <DateProvider>
          <FeedbackProvider>
            <ChatProvider>
              <OfflineIndicator />
              <AppRouter />
              <Credits />
              <Toaster duration={1800} richColors position="top-center" dir="rtl" />
            </ChatProvider>
          </FeedbackProvider>
        </DateProvider>
      </ThemeProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// Register Service Worker for PWA (production only to avoid dev console log noise and HMR caching)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

