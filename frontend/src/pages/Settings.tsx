import { useUIStore } from '../stores/uiStore';
import { Settings2, Moon, Sun, Laptop, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme, language, setLanguage, direction } = useUIStore();
  const isRTL = direction === 'rtl';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {isRTL ? 'הגדרות מערכת' : 'System Settings'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isRTL ? 'ניהול העדפות תצוגה ושפות ממשק' : 'Configure display settings, preferences, and interface languages.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Visual Settings Option */}
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 glassmorphism space-y-6">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Settings2 className="h-5 w-5 text-brand-600" />
            {isRTL ? 'העדפות תצוגה' : 'Interface Customization'}
          </h3>
          
          {/* Theme Switcher Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm block text-slate-800 dark:text-white">
                {isRTL ? 'מצב תצוגה כהה' : 'Dark Display Mode'}
              </span>
              <span className="text-2xs text-slate-400">
                {isRTL ? 'החלפה בין מצב בהיר לכהה' : 'Toggle between light and dark display modes.'}
              </span>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500" />
              )}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-850/60">
            <div>
              <span className="font-semibold text-sm block text-slate-800 dark:text-white">
                {isRTL ? 'שפת ממשק (ומבנה כיווניות)' : 'System Language & Layout Direction'}
              </span>
              <span className="text-2xs text-slate-400">
                {isRTL ? 'מעבר בין עברית (RTL) לאנגלית (LTR)' : 'Switch language and toggle LTR/RTL support.'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950'
                }`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('he')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  language === 'he'
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950'
                }`}
              >
                עברית
              </button>
            </div>
          </div>
          
        </div>

        {/* System parameters details */}
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 glassmorphism flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Laptop className="h-5 w-5 text-emerald-600" />
              {isRTL ? 'מידע על הסביבה' : 'Runtime Infrastructure'}
            </h3>
            
            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Client Engine:</span>
                <span className="font-semibold">Vite v7 + React v19</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Styling Core:</span>
                <span className="font-semibold">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Components layout:</span>
                <span className="font-semibold">Radix UI Primitives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status details:</span>
                <span className="font-semibold text-green-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Ready for production
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
