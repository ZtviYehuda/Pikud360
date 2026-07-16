import { useEffect, useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { EmptyState } from './ui/empty-state';
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from './ui/command';
import { 
  User, Network, FileText, Bell, Search
} from 'lucide-react';

export default function GlobalSearch() {
  const { searchOpen, setSearchOpen, direction } = useUIStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleToggleSearch = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handleToggleSearch);
    return () => window.removeEventListener('keydown', handleToggleSearch);
  }, [searchOpen, setSearchOpen]);

  // Reset search query on close
  useEffect(() => {
    if (!searchOpen) {
      setSearch('');
    }
  }, [searchOpen]);

  // Mock data definitions
  const mockEmployees = [
    { id: 'emp-1', name: 'אל״ם יוסי כהן', role: 'מפקד המרכז · מ.א. 7654321', path: '/workforce/employees/1', icon: User },
    { id: 'emp-2', name: 'רס״ן דנה אברהם', role: 'קצינת שלישות · מ.א. 8123456', path: '/workforce/employees/2', icon: User },
    { id: 'emp-3', name: 'סרן מיכאל לוי', role: 'רמ״ד תמיכה · מ.א. 9012345', path: '/workforce/employees/3', icon: User },
    { id: 'emp-4', name: 'סמל שירה אזולאי', role: 'מש״קית שלישות · מ.א. 9876543', path: '/workforce/employees/4', icon: User },
  ];

  const mockUnits = [
    { id: 'unit-1', name: 'מפקדת הפיקוד (מפח״ט)', role: 'קוד יחידה: 100', path: '/organization?unit=1', icon: Network },
    { id: 'unit-2', name: 'גדוד תקשוב 360', role: 'קוד יחידה: 200', path: '/organization?unit=2', icon: Network },
    { id: 'unit-3', name: 'מרכז השליטה (מכלול)', role: 'קוד יחידה: 300', path: '/organization?unit=3', icon: Network },
    { id: 'unit-4', name: 'מרפאה פיקודית', role: 'קוד יחידה: 400', path: '/organization?unit=4', icon: Network },
  ];

  const mockReports = [
    { id: 'rep-1', name: 'דוח מצבת נוכחות יומי', role: 'סטטוס נוכחות וכוח אדם לפי יחידה', path: '/reports?id=rep-1', icon: FileText },
    { id: 'rep-2', name: 'ניתוח מגמות היעדרות', role: 'גרפים וניתוח היסטורי חודשי', path: '/reports?id=rep-2', icon: FileText },
    { id: 'rep-3', name: 'דוח פילוח סטטוסים', role: 'התפלגות חיילים לפי סטטוסים שונים', path: '/reports?id=rep-3', icon: FileText },
    { id: 'rep-4', name: 'יומן פעילות ואודיט', role: 'תיעוד שינויים ופעולות משתמשים במערכת', path: '/reports?id=rep-4', icon: FileText },
  ];

  const mockNotifications = [
    { id: 'notif-1', name: 'מצבת בוקר לא הוזנה בגדוד תקשוב 360', role: 'נשלח לפני 5 דקות · דחיפות גבוהה', path: '/notifications', icon: Bell },
    { id: 'notif-2', name: 'אישור חופשה ממתין לחתימה', role: 'נשלח לפני שעתיים · שלישות', path: '/notifications', icon: Bell },
    { id: 'notif-3', name: 'עדכון גרסה למערכת פיקוד 360', role: 'נשלח אתמול · מנהל מערכת', path: '/notifications', icon: Bell },
  ];

  const isRtl = direction === 'rtl';

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border border-slate-200/80 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-xl">
        <Command className="rounded-none border-0">
          <CommandInput 
            value={search}
            onValueChange={setSearch}
            placeholder={t('employees:search_placeholder') || 'חיפוש גלובלי או פקודות...'}
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-12 px-1 text-slate-800 dark:text-white"
            autoFocus
          />
          <ScrollArea className="max-h-[360px]">
            <CommandList className="p-2 space-y-2">
              <CommandEmpty className="p-2">
                <EmptyState
                  icon={Search}
                  title="לא נמצאו תוצאות"
                  description={search ? `לא נמצאו פקודות או תוצאות עבור החיפוש "${search}"` : 'התחל להקליד כדי לחפש...'}
                />
              </CommandEmpty>

              <CommandGroup heading="עובדים">
                {mockEmployees.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.name} ${employee.role}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(employee.path);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <employee.icon className="h-4 w-4" />
                      </div>
                      <div className="text-right min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
                          {employee.name}
                        </p>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] truncate">
                          {employee.role}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="יחידות">
                {mockUnits.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={`${unit.name} ${unit.role}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(unit.path);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <unit.icon className="h-4 w-4" />
                      </div>
                      <div className="text-right min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
                          {unit.name}
                        </p>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] truncate">
                          {unit.role}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="דוחות">
                {mockReports.map((report) => (
                  <CommandItem
                    key={report.id}
                    value={`${report.name} ${report.role}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(report.path);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <report.icon className="h-4 w-4" />
                      </div>
                      <div className="text-right min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
                          {report.name}
                        </p>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] truncate">
                          {report.role}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="התראות">
                {mockNotifications.map((notification) => (
                  <CommandItem
                    key={notification.id}
                    value={`${notification.name} ${notification.role}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(notification.path);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="text-right min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
                          {notification.name}
                        </p>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] truncate">
                          {notification.role}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-4 py-2.5 text-[10px] text-slate-400 dark:text-slate-555 font-bold bg-slate-50/50 dark:bg-slate-900/50 select-none">
            <div className="flex items-center gap-2">
              <span>{isRtl ? 'לבחירה' : 'Select'}</span>
              <kbd className="bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">Enter</kbd>
              <span>{isRtl ? 'לניווט' : 'Navigate'}</span>
              <kbd className="bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">↑↓</kbd>
            </div>
            <div className="flex items-center gap-2">
              <span>{isRtl ? 'לסגירה' : 'Close'}</span>
              <kbd className="bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] font-sans border border-slate-200/50 dark:border-slate-700/50">ESC</kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
