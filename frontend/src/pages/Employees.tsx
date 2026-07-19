import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogActions,
} from '../components/ui/dialog';

interface Employee {
  id: string;
  name: string;
  role: string;
  dept: string;
  email: string;
  active: boolean;
}

export default function Employees() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Alice Smith', role: 'WFM Specialist', dept: 'HR & Operations', email: 'alice@pikud360.com', active: true },
    { id: '2', name: 'Bob Johnson', role: 'Security Analyst', dept: 'Information Security', email: 'bob@pikud360.com', active: true },
    { id: '3', name: 'Charlie Green', role: 'Shift Supervisor', dept: 'Logistics', email: 'charlie@pikud360.com', active: false },
    { id: '4', name: 'Dana Levi', role: 'HR Manager', dept: 'HR & Operations', email: 'dana@pikud360.com', active: true },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states for new employee
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('HR & Operations');
  const [newEmail, setNewEmail] = useState('');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole || !newEmail) return;

    const newEmp: Employee = {
      id: String(employees.length + 1),
      name: newName,
      role: newRole,
      dept: newDept,
      email: newEmail,
      active: true,
    };

    setEmployees([...employees, newEmp]);
    setIsAddOpen(false);

    // Reset fields
    setNewName('');
    setNewRole('');
    setNewEmail('');
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.dept === selectedDept;

    return matchesSearch && matchesDept;
  });

  const departments = ['All', 'HR & Operations', 'Information Security', 'Logistics'];

  return (
    <div className="space-y-6">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('employees:title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {t('employees:desc')}
          </p>
        </div>
        
        <Button className="w-fit" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="h-4.5 w-4.5" />
          {t('employees:add_employee')}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex gap-3 bg-white p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              className="pl-10"
              placeholder={t('employees:search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className={`flex items-center gap-2 ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t('buttons:filter')}</span>
          </Button>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/80 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">מחלקות:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-brand-600 border-brand-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {dept === 'All' ? 'הכל' : dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Employee List Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-center">
          <SlidersHorizontal className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">לא נמצאו עובדים</h3>
          <p className="text-xs text-slate-400 mt-1">נסה לשנות את תנאי הסינון או החיפוש שלך</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-slate-200/60 dark:border-slate-800/85"
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold font-heading text-lg">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <Badge variant={emp.active ? 'success' : 'secondary'}>
                  {emp.active ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
              
              <div className="mt-4">
                <h4 className="font-heading text-base font-bold text-slate-800 dark:text-white">{emp.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{emp.role}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">{emp.dept}</p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-400 font-medium">
                <span>{emp.email}</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent
          title="הוספת משרת חדש"
          description="מלא את הפרטים הבאים כדי להוסיף משרת חדש ליחידה"
          size="md"
        >
          <form onSubmit={handleAddEmployee} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">שם מלא</label>
              <Input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="למשל: ישראל ישראלי"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">תפקיד</label>
              <Input
                type="text"
                required
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="למשל: מנתח מערכות"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">מחלקה</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-white text-xs font-medium focus:outline-hidden"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              >
                <option value="HR & Operations">HR & Operations</option>
                <option value="Information Security">Information Security</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">דואר אלקטרוני</label>
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <DialogFooter className="pt-4">
              <DialogActions>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" size="sm">
                  הוסף משרת
                </Button>
              </DialogActions>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

