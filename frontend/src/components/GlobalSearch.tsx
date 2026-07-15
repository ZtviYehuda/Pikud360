import { useEffect, useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Search, Loader2 } from 'lucide-react';
import { EmptyState } from './ui/empty-state';

export default function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // Simulate loading state when query changes
  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset query on close
  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
    }
  }, [searchOpen]);

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border border-slate-200/80 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 gap-2.5">
          <Search className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('employees:search_placeholder') || 'חיפוש גלובלי...'}
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-9 px-0 text-slate-800 dark:text-white"
            autoFocus
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-450 dark:text-slate-500 shrink-0" />
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto p-4">
          {query.trim() && !loading ? (
            <EmptyState
              icon={Search}
              title="לא נמצאו תוצאות"
              description={`לא נמצאו תוצאות עבור החיפוש "${query}"`}
            />
          ) : !query.trim() ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
              הקלד כדי לחפש עובדים, יחידות, שיבוצים והגדרות...
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              <span>מחפש נתונים במערכת...</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-4 py-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5">
            <span>לבחירה</span>
            <kbd className="bg-slate-150 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">Enter</kbd>
            <span>לניווט</span>
            <kbd className="bg-slate-150 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">↑↓</kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>לסגירה</span>
            <kbd className="bg-slate-150 dark:bg-slate-850 px-1 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">ESC</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
