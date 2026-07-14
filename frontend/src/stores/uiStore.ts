import { create } from 'zustand';

type Theme = 'light' | 'dark';
type Language = 'en' | 'he';
type Direction = 'ltr' | 'rtl';

interface UIState {
  theme: Theme;
  language: Language;
  direction: Direction;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>((set, get) => {
  // Initialize state based on user settings/system preference
  const initialTheme = (localStorage.getItem('theme') as Theme) || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  const initialLanguage = (localStorage.getItem('lang') as Language) || 'en';
  const initialDirection: Direction = initialLanguage === 'he' ? 'rtl' : 'ltr';

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
    
    toggleTheme: () => {
      const nextTheme = get().theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: nextTheme });
    },
    
    toggleSidebar: () => {
      set({ sidebarCollapsed: !get().sidebarCollapsed });
    },
    
    setSidebarCollapsed: (collapsed: boolean) => {
      set({ sidebarCollapsed: collapsed });
    },
    
    setLanguage: (lang: Language) => {
      const nextDir: Direction = lang === 'he' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('dir', nextDir);
      document.documentElement.setAttribute('lang', lang);
      set({ language: lang, direction: nextDir });
    }
  };
});
