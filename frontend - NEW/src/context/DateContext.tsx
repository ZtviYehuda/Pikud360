import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { isSameDay } from "date-fns";

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      const savedDate = localStorage.getItem("app_selected_date");
      const lastLoginDate = localStorage.getItem("app_last_login_date");
      const today = new Date();
      
      // Check if this is a new day (first login today)
      if (lastLoginDate) {
        const lastLogin = new Date(lastLoginDate);
        // If last login was on a different day, reset to today
        if (!isSameDay(lastLogin, today)) {
          localStorage.setItem("app_last_login_date", today.toISOString());
          return today;
        }
      } else {
        // First time ever - set last login date
        localStorage.setItem("app_last_login_date", today.toISOString());
        return today;
      }
      
      // Same day - load saved date if exists
      if (savedDate) {
        const parsed = new Date(savedDate);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse date from storage", e);
    }
    return new Date();
  });

  useEffect(() => {
    localStorage.setItem("app_selected_date", selectedDate.toISOString());
  }, [selectedDate]);

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return context;
}
