import { create } from 'zustand';
import i18n from '../i18n';

type Theme = 'light' | 'dark';
type Language = 'en' | 'he';
type Direction = 'ltr' | 'rtl';

interface UIState {
  theme: Theme;
  language: Language;
  direction: Direction;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  searchOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setLanguage: (lang: Language) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => {
  // Initialize state based on user settings/system preference
  const initialTheme = (localStorage.getItem('theme') as Theme) || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  const initialLanguage = (localStorage.getItem('lang') as Language) || 'he';
  const initialDirection: Direction = initialLanguage === 'en' ? 'ltr' : 'rtl';

  // Sync initial language configuration with i18n engine
  i18n.changeLanguage(initialLanguage);

  // Apply initial attributes
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('dir', initialDirection);
  document.documentElement.setAttribute('lang', initialLanguage);

  return {
    theme: initialTheme,
    language: initialLanguage,
    direction: initialDirection,
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    searchOpen: false,
    
    toggleTheme: () => {
      const nextTheme = get().theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', nextTheme);

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

      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }

      const _ = window.getComputedStyle(document.body).opacity;
      setTimeout(() => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 20);

      set({ theme: nextTheme });
    },
    
    toggleSidebar: () => {
      set({ sidebarCollapsed: !get().sidebarCollapsed });
    },
    
    setSidebarCollapsed: (collapsed: boolean) => {
      set({ sidebarCollapsed: collapsed });
    },

    setMobileSidebarOpen: (open: boolean) => {
      set({ mobileSidebarOpen: open });
    },

    toggleMobileSidebar: () => {
      set({ mobileSidebarOpen: !get().mobileSidebarOpen });
    },
    
    setLanguage: (lang: Language) => {
      const nextDir: Direction = lang === 'he' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('dir', nextDir);
      document.documentElement.setAttribute('lang', lang);
      i18n.changeLanguage(lang);
      set({ language: lang, direction: nextDir });
    },

    setSearchOpen: (open: boolean) => {
      set({ searchOpen: open });
    }
  };
});
