import * as React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export const FloatingHelpButton: React.FC = () => {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg cursor-pointer transition-colors"
      title="עזרה ותמיכה"
    >
      <HelpCircle className="h-6 w-6" />
    </motion.button>
  );
};
FloatingHelpButton.displayName = "FloatingHelpButton";
