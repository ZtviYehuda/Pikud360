import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, MessageCircle } from "lucide-react";

export const BirthdayCard: React.FC = () => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-950/40 transition-all duration-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full select-none text-right"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Top-left WhatsApp Send Blessing button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
          title="שליחת ברכה ב-WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5 fill-current" />
          <span>שליחת ברכה</span>
        </button>

        {/* Header Title & Subtitle */}
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            ימי הולדת
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            חוגגים השבוע
          </p>
        </div>
      </div>

      {/* Birthday Person Active Card Container */}
      <div className="my-auto py-4 flex justify-center">
        <div className="w-44 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex flex-col items-center text-center space-y-2.5 shadow-2xs">
          {/* Avatar Circle */}
          <div className="h-14 w-14 rounded-2xl bg-blue-200/60 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-base shadow-2xs">
            נר
          </div>

          {/* Name & Date */}
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              נעם רז
            </h4>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 justify-center">
              <Calendar className="h-3 w-3" />
              <span>25 ביולי</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
BirthdayCard.displayName = "BirthdayCard";
