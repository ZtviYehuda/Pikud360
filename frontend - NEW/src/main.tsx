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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <ThemeProvider>
        <DateProvider>
          <FeedbackProvider>
            <ChatProvider>
              <AppRouter />
              <Toaster richColors position="top-center" dir="rtl" />
            </ChatProvider>
          </FeedbackProvider>
        </DateProvider>
      </ThemeProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully with scope:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

