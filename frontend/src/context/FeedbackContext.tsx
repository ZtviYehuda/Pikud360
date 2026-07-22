import React, { createContext, useContext, useState } from "react";
import { FeedbackCenter } from "@/components/common/FeedbackCenter";

interface FeedbackContextType {
  openFeedback: (contextPage?: string) => void;
  closeFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextPage, setContextPage] = useState<string>("");

  const openFeedback = (page?: string) => {
    setContextPage(page || "");
    setIsOpen(true);
  };

  const closeFeedback = () => {
    setIsOpen(false);
    setTimeout(() => setContextPage(""), 300); // clear after animation
  };

  return (
    <FeedbackContext.Provider value={{ openFeedback, closeFeedback }}>
      {children}
      <FeedbackCenter isOpen={isOpen} onClose={closeFeedback} contextPage={contextPage} />
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
