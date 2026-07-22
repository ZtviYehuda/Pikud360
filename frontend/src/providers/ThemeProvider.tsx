import * as React from "react";
import { useUIStore } from "../stores/uiStore";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const uiTheme = useUIStore((state) => state.theme);
  const toggleUITheme = useUIStore((state) => state.toggleTheme);

  const [theme, setThemeState] = React.useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return uiTheme || "system";
  });

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const applyTheme = React.useCallback((targetTheme: Theme) => {
    let effectiveDark = false;
    if (targetTheme === "dark") {
      effectiveDark = true;
    } else if (targetTheme === "light") {
      effectiveDark = false;
    } else {
      effectiveDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    const root = document.documentElement;

    // Suppress CSS transitions temporarily for instant & clean theme switch
    const style = document.createElement("style");
    style.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
           transition: none !important;
           animation: none !important;
         }`
      )
    );
    document.head.appendChild(style);

    if (effectiveDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    const _ = window.getComputedStyle(root).opacity;
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 20);

    setIsDark(effectiveDark);
  }, []);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  }, [applyTheme]);

  const toggleTheme = React.useCallback(() => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    toggleUITheme();
  }, [isDark, setTheme, toggleUITheme]);

  // Sync initial setup
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // System media query listener
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Storage listener for multi-tab sync
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const next = e.newValue as Theme;
        setThemeState(next);
        applyTheme(next);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
      toggleTheme,
    }),
    [theme, isDark, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside ThemeProvider
    return {
      theme: "light",
      isDark: document.documentElement.classList.contains("dark"),
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
