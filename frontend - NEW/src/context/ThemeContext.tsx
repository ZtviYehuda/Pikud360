import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuthContext } from "./AuthContext";
import { useEmployees } from "@/hooks/useEmployees";

type Theme = "dark" | "light";
type AccentColor = string; // Support both presets (blue, emerald) and hex codes (#ff0000)
type FontSize = "small" | "normal" | "large";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  showAiSupport: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setShowAiSupport: (show: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuthContext();
  const { updatePreferences } = useEmployees();

  // Track synchronization state to prevent infinite loops or redundant calls
  const lastSyncedUser = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem("accentColor");
    return (saved as AccentColor) || "blue";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("fontSize");
    return (saved as FontSize) || "normal";
  });

  const [showAiSupport, setShowAiSupport] = useState<boolean>(() => {
    const saved = localStorage.getItem("showAiSupport");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("showAiSupport", String(showAiSupport));
  }, [showAiSupport]);

  // 1. Initial Load from User Object when user profile is loaded or changed
  useEffect(() => {
    if (user && user.id !== lastSyncedUser.current) {
      // We are loading a new user, flag that we shouldn't sync these initial values back
      isSyncingRef.current = true;

      if (user.theme) setTheme(user.theme as Theme);
      if (user.accent_color) setAccentColor(user.accent_color as AccentColor);
      if (user.font_size) setFontSize(user.font_size as FontSize);

      lastSyncedUser.current = user.id;

      // Use a timeout to ensure state updates have processed before allowing sync
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }
  }, [user]);

  // 2. Apply theme to document and save to local storage + Sync to server
  useEffect(() => {
    const root = window.document.documentElement;

    // Theme class
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Accent Color class or Dynamic Variable
    root.classList.forEach((cls) => {
      if (cls.startsWith("accent-")) root.classList.remove(cls);
    });

    if (accentColor.startsWith("#")) {
      // Dynamic Custom Color
      root.style.setProperty("--primary", accentColor);
      
      // Calculate secondary and accent (usually very light version of primary)
      // For simplicity, we use the color with 0.1 opacity for secondary
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : "0, 116, 255";
      };
      
      const rgb = hexToRgb(accentColor);
      root.style.setProperty("--primary-rgb", rgb);
      
      if (theme === "light") {
        root.style.setProperty("--secondary", `rgba(${rgb}, 0.1)`);
        root.style.setProperty("--accent", `rgba(${rgb}, 0.1)`);
        root.style.setProperty("--secondary-foreground", accentColor);
      } else {
        root.style.setProperty("--secondary", `rgba(${rgb}, 0.2)`);
        root.style.setProperty("--accent", `rgba(${rgb}, 0.2)`);
        root.style.setProperty("--secondary-foreground", "#ffffff");
      }
    } else {
      // Preset from index.css
      root.classList.add(`accent-${accentColor}`);
      // Clear custom properties if they were set
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-rgb");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--secondary-foreground");
    }
    localStorage.setItem("accentColor", accentColor);

    // Font Size style
    const sizeMap = {
      small: "14px",
      normal: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[fontSize];
    localStorage.setItem("fontSize", fontSize);

    // 3. Sync with server if user is logged in and we aren't in the middle of a profile load
    if (user && !isSyncingRef.current) {
      // Check if values actually changed from what's in the user object to avoid redundant calls
      const hasChanged =
        theme !== user.theme ||
        accentColor !== user.accent_color ||
        fontSize !== user.font_size;

      if (hasChanged) {
        updatePreferences({
          theme,
          accent_color: accentColor,
          font_size: fontSize,
        }).then(() => {
          refreshUser();
        });
      }
    }
  }, [theme, accentColor, fontSize, user, updatePreferences, refreshUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        fontSize,
        showAiSupport,
        toggleTheme,
        setTheme,
        setAccentColor,
        setFontSize,
        setShowAiSupport,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
