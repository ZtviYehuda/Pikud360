import React, { createContext, useContext, useState } from "react";
import { FeedbackCenter } from "@/components/common/FeedbackCenter";

interface FeedbackContextType {
  openFeedback: (contextPage?: string, onReturn?: () => void) => void;
  closeFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextPage, setContextPage] = useState<string>("");
  const [onReturnCallback, setOnReturnCallback] = useState<(() => void) | null>(null);

  const openFeedback = (page?: string, onReturn?: () => void) => {
    let targetPage = page;
    if (!targetPage && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/") targetPage = "לוח בקרה";
      else if (path === "/employees") targetPage = "ניהול שוטרים";
      else if (path === "/attendance") targetPage = "ניהול נוכחות";
      else if (path === "/roster") targetPage = "סידור עבודה";
      else if (path === "/transfers") targetPage = "בקשות העברה";
      else if (path === "/messaging" || path === "/feedback") targetPage = "מרכז הודעות ותקשורת";
      else if (path === "/audit") targetPage = "מרכז ניטור וביקורת";
      else if (path === "/settings") targetPage = "הגדרות מערכת";
      else targetPage = document.title || path;
    }
    setContextPage(targetPage || "");
    setOnReturnCallback(onReturn ? () => onReturn : null);
    setTimeout(() => { setIsOpen(true); }, 60);
  };

  const closeFeedback = () => {
    setIsOpen(false);
    setTimeout(() => {
      setContextPage("");
      setOnReturnCallback(null);
    }, 300);
  };

  const handleReturn = () => {
    const cb = onReturnCallback;
    closeFeedback();
    if (cb) {
      setTimeout(() => cb(), 150);
    }
  };

  return (
    <FeedbackContext.Provider value={{ openFeedback, closeFeedback }}>
      {children}
      <FeedbackCenter
        isOpen={isOpen}
        onClose={closeFeedback}
        onBack={handleReturn}
        contextPage={contextPage}
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
