import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { 
  schedulingService, 
  ScheduleStatus, 
  ScheduleSettings, 
  ShiftType, 
  UnitEmployee, 
  DailyDashboardSummary 
} from '../services/schedulingService';
import { 
  Users, X, Search, Calendar, SlidersHorizontal, 
  Edit2, Trash2, Shield, AlertTriangle, Sparkles, ChevronDown, ChevronUp, GitFork
} from 'lucide-react';
import Unauthorized from './Unauthorized';

export default function WorkforceScheduling() {
  const navigate = useNavigate();
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

  if (!hasPermission('schedule.view')) {
    return <Unauthorized />;
  }

  // Persist selected organization unit
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    return localStorage.getItem('pikud360_selected_unit_id') || 'unit-uuid-555';
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('pikud360_selected_date') || new Date().toISOString().split('T')[0];
  });

  const [employees, setEmployees] = useState<UnitEmployee[]>([]);
  const [statuses, setStatuses] = useState<ScheduleStatus[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DailyDashboardSummary | null>(null);

  // Selector dropdown state
  const [isTreeDropdownOpen, setIsTreeDropdownOpen] = useState(false);
  const treeDropdownRef = useRef<HTMLDivElement>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const sortField = 'name';

  // Bulk assignment state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkStatusId, setBulkStatusId] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Single assignment Modal state
  const [editingEmployee, setEditingEmployee] = useState<{ id: string; name: string } | null>(null);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  
  const [statusId, setStatusId] = useState('');
  const [shiftTypeId, setShiftTypeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  // Persist unit selection and dates
  useEffect(() => {
    localStorage.setItem('pikud360_selected_unit_id', selectedUnitId);
  }, [selectedUnitId]);

  useEffect(() => {
    localStorage.setItem('pikud360_selected_date', selectedDate);
  }, [selectedDate]);

  // Load backend details
  useEffect(() => {
    loadSchedulingData();
  }, [selectedUnitId, selectedDate]);

  // Handle closing tree dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (treeDropdownRef.current && !treeDropdownRef.current.contains(event.target as Node)) {
        setIsTreeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSchedulingData = async () => {
    try {
      // 1. Load active statuses
      const statusData = await schedulingService.getStatuses();
      setStatuses(statusData);

      // 2. Load settings mode
      const settingsData = await schedulingService.getSettings(selectedUnitId);
      setSettings(settingsData);

      // 3. Load permitted organization units tree
      const treeData = await schedulingService.getOrganizationTree();
      setOrgTree(treeData);

      // 4. Load unit employees and assignments for selected unit and date
      const empData = await schedulingService.getUnitEmployees(selectedUnitId, selectedDate);
      setEmployees(empData);

      // 5. Load dashboard aggregate details
      const dashData = await schedulingService.getDashboardSummary(selectedUnitId, selectedDate);
      setDashboardSummary(dashData);

      // 6. Load shifts (if mode is SHIFT_BASED)
      if (settingsData.scheduling_mode === 'SHIFT_BASED') {
        try {
          const shiftsData = await schedulingService.getShiftTypes(selectedUnitId);
          setShifts(shiftsData);
        } catch {
          setShifts([
            { id: 'shift-uuid-morning', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: isRTL ? 'בוקר' : 'Morning', start_time: '06:00', end_time: '14:00', active: true },
            { id: 'shift-uuid-afternoon', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: isRTL ? 'צהריים' : 'Afternoon', start_time: '14:00', end_time: '22:00', active: true },
            { id: 'shift-uuid-night', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: isRTL ? 'לילה' : 'Night', start_time: '22:00', end_time: '06:00', active: true }
          ]);
        }
      }
    } catch (err: any) {
      // Local development fallback states
      setStatuses([
        { id: 's-avail', tenant_id: 't-1', code: 'AVAILABLE', name: isRTL ? 'זמין' : 'Available', category: 'AVAILABLE', color: '#4CAF50', is_active: true, sort_order: 1 },
        { id: 's-sick', tenant_id: 't-1', code: 'SICK', name: isRTL ? 'חולה' : 'Sick', category: 'SICK', color: '#F44336', is_active: true, sort_order: 2 },
        { id: 's-vac', tenant_id: 't-1', code: 'VACATION', name: isRTL ? 'חופשה' : 'Vacation', category: 'VACATION', color: '#FF9800', is_active: true, sort_order: 3 },
        { id: 's-train', tenant_id: 't-1', code: 'TRAINING', name: isRTL ? 'אימון' : 'Training', category: 'TRAINING', color: '#9C27B0', is_active: true, sort_order: 4 },
        { id: 's-rein', tenant_id: 't-1', code: 'REINFORCEMENT', name: isRTL ? 'תגבור' : 'Reinforcement', category: 'REINFORCEMENT', color: '#00BCD4', is_active: true, sort_order: 5 }
      ]);
      setSettings({
        id: 'settings-mock',
        tenant_id: 't-1',
        organization_unit_id: selectedUnitId,
        scheduling_mode: 'DIRECT_STATUS'
      });
      setOrgTree([
        {
          id: 'unit-uuid-555',
          name: isRTL ? 'מפקדת חטיבה' : 'Brigade HQ',
          code: 'BRIG_HQ',
          children: [
            { id: 'unit-uuid-666', name: isRTL ? 'פלוגה א' : 'Company A', code: 'CO_A', children: [] },
            { id: 'unit-uuid-777', name: isRTL ? 'פלוגה ב' : 'Company B', code: 'CO_B', children: [] }
          ]
        }
      ]);
      setEmployees([
        {
          employee_id: 'employee-uuid-111',
          display_name: 'David Cohen',
          rank: 'Captain',
          role: 'Team Leader',
          organization_unit: { id: selectedUnitId, name: 'Brigade HQ' },
          daily_assignment: {
            id: 'sched-1',
            status_id: 's-avail',
            status_code: 'AVAILABLE',
            status_name: 'Available',
            color: '#4CAF50',
            notes: 'Fully Available'
          }
        },
        {
          employee_id: 'employee-uuid-222',
          display_name: 'Moshe Levi',
          rank: 'Lieutenant',
          role: 'Operations Officer',
          organization_unit: { id: selectedUnitId, name: 'Brigade HQ' },
          daily_assignment: {
            id: 'sched-2',
            status_id: 's-sick',
            status_code: 'SICK',
            status_name: 'Sick',
            color: '#F44336',
            notes: 'Fever'
          }
        },
        {
          employee_id: 'employee-uuid-333',
          display_name: 'Avi Azulay',
          rank: 'Sergeant',
          role: 'Radio Operator',
          organization_unit: { id: selectedUnitId, name: 'Brigade HQ' },
          daily_assignment: null
        }
      ]);
      setDashboardSummary({
        date: selectedDate,
        total_employees: 3,
        assigned_employees: 2,
        unassigned_employees: 1,
        statuses: { AVAILABLE: 1, SICK: 1 },
        child_units: [
          { unit_id: 'unit-uuid-666', unit_name: isRTL ? 'פלוגה א' : 'Company A', total_employees: 10, assigned_employees: 8, unassigned_employees: 2 },
          { unit_id: 'unit-uuid-777', unit_name: isRTL ? 'פלוגה ב' : 'Company B', total_employees: 12, assigned_employees: 6, unassigned_employees: 6 }
        ]
      });
    }
  };

  const handleEditOpen = (emp: { id: string; name: string }, existing?: any) => {
    if (!hasPermission('schedule.manage')) {
      alert(isRTL ? 'אין לך הרשאה מתאימה לביצוע פעולה זו.' : 'You lack permission to update schedules.');
      return;
    }
    setEditingEmployee(emp);
    if (existing) {
      setActiveScheduleId(existing.id);
      setStatusId(existing.status_id);
      setShiftTypeId(existing.shift_type_id || '');
      setStartTime(existing.start_time || '');
      setEndTime(existing.end_time || '');
      setNotes(existing.notes || '');
    } else {
      setActiveScheduleId(null);
      setStatusId('');
      setShiftTypeId('');
      setStartTime('');
      setEndTime('');
      setNotes('');
    }
  };

  const handleSingleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !statusId) return;

    const payload = {
      employee_id: editingEmployee.id,
      organization_unit_id: selectedUnitId,
      schedule_date: selectedDate,
      status_id: statusId,
      shift_type_id: settings?.scheduling_mode === 'SHIFT_BASED' && shiftTypeId ? shiftTypeId : undefined,
      start_time: settings?.scheduling_mode === 'SHIFT_BASED' && startTime ? startTime : undefined,
      end_time: settings?.scheduling_mode === 'SHIFT_BASED' && endTime ? endTime : undefined,
      notes: notes || undefined
    };

    try {
      if (activeScheduleId) {
        await schedulingService.updateAssignment(activeScheduleId, payload);
      } else {
        await schedulingService.assignStatus(payload);
      }
      loadSchedulingData();
      setEditingEmployee(null);
    } catch (err: any) {
      // Mock update fallback
      const targetStatus = statuses.find(st => st.id === statusId);
      const mockResult = {
        id: activeScheduleId || Math.random().toString(),
        status_id: statusId,
        status_code: targetStatus?.code || 'UNKNOWN',
        status_name: targetStatus?.name || 'Unknown',
        color: targetStatus?.color || '#9E9E9E',
        shift_type_id: shiftTypeId || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        notes
      };

      setEmployees(employees.map(emp => emp.employee_id === editingEmployee.id ? { ...emp, daily_assignment: mockResult } : emp));
      setEditingEmployee(null);
    }
  };

  const handleDeleteAssignment = async (schedId: string) => {
    if (!hasPermission('schedule.manage')) return;
    if (!confirm(isRTL ? 'האם להסיר את שיבוץ העובד?' : 'Are you sure you want to remove this assignment?')) return;

    try {
      await schedulingService.deleteAssignment(schedId);
      loadSchedulingData();
    } catch {
      // Fallback update
      setEmployees(employees.map(emp => emp.daily_assignment?.id === schedId ? { ...emp, daily_assignment: null } : emp));
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkStatusId || selectedEmployeeIds.length === 0) return;
    try {
      await schedulingService.bulkAssign({
        organization_unit_id: selectedUnitId,
        date: selectedDate,
        status_id: bulkStatusId,
        employee_ids: selectedEmployeeIds
      });
      loadSchedulingData();
      setSelectedEmployeeIds([]);
      setShowBulkConfirm(false);
    } catch {
      // Mock bulk apply
      const targetStatus = statuses.find(st => st.id === bulkStatusId);
      setEmployees(employees.map(emp => {
        if (selectedEmployeeIds.includes(emp.employee_id)) {
          return {
            ...emp,
            daily_assignment: {
              id: Math.random().toString(),
              status_id: bulkStatusId,
              status_code: targetStatus?.code || 'UNKNOWN',
              status_name: targetStatus?.name || 'Unknown',
              color: targetStatus?.color || '#9E9E9E',
              notes: 'Bulk Assignment'
            }
          };
        }
        return emp;
      }));
      setSelectedEmployeeIds([]);
      setShowBulkConfirm(false);
    }
  };

  // Helper to find name of current active unit in the tree recursively
  const findUnitName = (nodes: any[], id: string): string | null => {
    for (const node of nodes) {
      if (node.id === id) return node.name;
      if (node.children) {
        const found = findUnitName(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentUnitName = findUnitName(orgTree, selectedUnitId) || (isRTL ? 'מפקדת חטיבה' : 'Brigade HQ');

  // Recursive tree node renderer inside custom dropdown selector
  const renderTreeNodes = (nodes: any[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setSelectedUnitId(node.id);
            setIsTreeDropdownOpen(false);
          }}
          className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            selectedUnitId === node.id 
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400 font-bold' 
              : 'text-slate-700 dark:text-slate-350'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <GitFork className="h-3.5 w-3.5 opacity-60 text-slate-400" />
          <span>{node.name}</span>
        </button>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {renderTreeNodes(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Compile calculations for dashboard cards
  const totalPersonnelCount = dashboardSummary ? dashboardSummary.total_employees : employees.length;
  const assignedCount = dashboardSummary ? dashboardSummary.assigned_employees : employees.filter(emp => emp.daily_assignment !== null).length;
  const unassignedCount = dashboardSummary ? dashboardSummary.unassigned_employees : Math.max(0, totalPersonnelCount - assignedCount);

  // Status mapping counts
  const statusDistribution: Record<string, number> = {};
  statuses.forEach(st => {
    statusDistribution[st.name] = 0;
  });

  if (dashboardSummary && dashboardSummary.statuses) {
    Object.entries(dashboardSummary.statuses).forEach(([code, val]) => {
      const st = statuses.find(s => s.code.toUpperCase() === code.toUpperCase());
      if (st) {
        statusDistribution[st.name] = val;
      }
    });
  } else {
    employees.forEach(emp => {
      if (emp.daily_assignment) {
        const st = statuses.find(s => s.id === emp.daily_assignment?.status_id);
        if (st) {
          statusDistribution[st.name] = (statusDistribution[st.name] || 0) + 1;
        }
      }
    });
  }

  // Shift mapping counts
  const shiftDistribution: Record<string, number> = { Morning: 0, Afternoon: 0, Night: 0 };
  if (dashboardSummary && dashboardSummary.shifts) {
    Object.entries(dashboardSummary.shifts).forEach(([key, val]) => {
      const sh = shifts.find(s => s.name.toUpperCase() === key.toUpperCase());
      if (sh) {
        shiftDistribution[sh.name] = val;
      } else {
        shiftDistribution[key] = val;
      }
    });
  } else {
    if (settings?.scheduling_mode === 'SHIFT_BASED') {
      employees.forEach(emp => {
        if (emp.daily_assignment && emp.daily_assignment.shift_type_id) {
          const sh = shifts.find(s => s.id === emp.daily_assignment?.shift_type_id);
          if (sh) {
            shiftDistribution[sh.name] = (shiftDistribution[sh.name] || 0) + 1;
          }
        }
      });
    }
  }

  // Filter & Search matching rules
  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.rank.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'UNASSIGNED') {
          return emp.daily_assignment === null;
        } else {
          return emp.daily_assignment?.status_id === statusFilter;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return a.display_name.localeCompare(b.display_name);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* 1. Top bar filter parameters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-sm glassmorphism">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600 animate-pulse" />
            {isRTL ? 'שיבוץ כוח אדם יומי' : 'Daily Workforce Scheduling'}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {isRTL ? 'לוח פיקוח לתכנון שיבוצים יומיים לכוח האדם.' : 'Commander planning control panel for daily status allocation.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Org Tree Selector Dropdown */}
          <div className="relative flex items-center gap-2" ref={treeDropdownRef}>
            <label className="text-xs font-bold text-slate-455">{isRTL ? 'יחידה:' : 'Unit:'}</label>
            <button
              type="button"
              onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer font-semibold shadow-sm hover:bg-slate-100/50"
            >
              <span>{currentUnitName}</span>
              {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isTreeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-250 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-55 max-h-60 overflow-y-auto animate-fade-in">
                {orgTree.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    {isRTL ? 'אין יחידות זמינות' : 'No units available'}
                  </div>
                ) : (
                  renderTreeNodes(orgTree)
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 font-mono text-slate-800 dark:text-white"
            />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-650 dark:bg-brand-950/20 dark:text-brand-400">
            <Shield className="h-3.5 w-3.5" />
            {settings?.scheduling_mode || 'DIRECT_STATUS'}
          </span>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{isRTL ? 'סה"כ כוח אדם' : 'Total Personnel'}</span>
            <Users className="h-5 w-5 text-brand-655" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{totalPersonnelCount}</h4>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{isRTL ? 'שוייך היום' : 'Assigned today'}</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{assignedCount}</h4>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{isRTL ? 'טרם שוייך' : 'Not assigned'}</span>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{unassignedCount}</h4>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <span className="text-xs font-bold text-slate-400">{isRTL ? 'פילוח סטטוסים' : 'Manpower Distribution'}</span>
          <div className="mt-2 space-y-1 max-h-16 overflow-y-auto pr-1">
            {Object.entries(statusDistribution).map(([name, val]) => (
              <div key={name} className="flex justify-between text-2xs text-slate-500 font-medium">
                <span>{name}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 Child Units Breakdown */}
      {dashboardSummary?.child_units && dashboardSummary.child_units.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <h3 className="font-heading text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            {isRTL ? 'פירוט לפי תתי-יחידות' : 'Sub-Units Breakdown'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dashboardSummary.child_units.map(child => (
              <div 
                key={child.unit_id} 
                onClick={() => setSelectedUnitId(child.unit_id)}
                className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:border-brand-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                    <GitFork className="h-4 w-4 text-brand-500" />
                    {child.unit_name}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-550">
                      <span>{isRTL ? 'סה"כ כוח אדם:' : 'Total Personnel:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-350">{child.total_employees}</span>
                    </div>
                    <div className="flex justify-between text-slate-550">
                      <span>{isRTL ? 'שוייך:' : 'Assigned:'}</span>
                      <span className="font-bold text-emerald-600">{child.assigned_employees}</span>
                    </div>
                    <div className="flex justify-between text-slate-550">
                      <span>{isRTL ? 'טרם שוייך:' : 'Unassigned:'}</span>
                      <span className="font-bold text-rose-500">{child.unassigned_employees}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHIFT_BASED Sub-Dashboard shifts counters */}
      {settings?.scheduling_mode === 'SHIFT_BASED' && (
        <div className="rounded-xl bg-white p-4 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism">
          <span className="text-xs font-bold text-slate-400 mb-2.5 block">{isRTL ? 'איוש משמרות פעיל' : 'Active Shift Allocation'}</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(shiftDistribution).map(([name, count]) => (
              <div key={name} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <span className="text-2xs font-semibold text-slate-500">{name}</span>
                <span className="text-sm font-bold text-indigo-650">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Bulk Actions Widget */}
      {hasPermission('schedule.bulk_manage') && selectedEmployeeIds.length > 0 && (
        <div className="bg-brand-50/40 dark:bg-brand-950/10 border border-brand-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-655" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRTL 
                ? `נבחרו ${selectedEmployeeIds.length} עובדים לשיבוץ מרוכז` 
                : `Selected ${selectedEmployeeIds.length} employees for bulk status allocation`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={bulkStatusId}
              onChange={(e) => setBulkStatusId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
            >
              <option value="">{isRTL ? '-- בחר סטטוס --' : '-- Choose Status --'}</option>
              {statuses.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={!bulkStatusId}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRTL ? 'החל שיבוץ מרוכז' : 'Apply Bulk'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Filters & Searching */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-sm glassmorphism">
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-white"
            placeholder={isRTL ? 'חפש עובדים...' : 'Search employees...'}
          />
        </div>

        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4.5 w-4.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="ALL">{isRTL ? 'כל הסטטוסים' : 'All Statuses'}</option>
            <option value="UNASSIGNED">{isRTL ? 'טרם שוייך' : 'Not Assigned'}</option>
            {statuses.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Main Planning Table */}
      <div className="rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 glassmorphism overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-medium text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
                {hasPermission('schedule.bulk_manage') && (
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds(filteredEmployees.map(emp => emp.employee_id));
                        } else {
                          setSelectedEmployeeIds([]);
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                  </th>
                )}
                <th className="py-3 px-4">{isRTL ? 'עובד' : 'Employee'}</th>
                <th className="py-3 px-4">{isRTL ? 'דרגה / תפקיד' : 'Rank / Role'}</th>
                <th className="py-3 px-4">{isRTL ? 'יחידה ארגונית' : 'Org Unit'}</th>
                <th className="py-3 px-4">{isRTL ? 'שיבוץ יומי' : 'Daily Status'}</th>
                {settings?.scheduling_mode === 'SHIFT_BASED' && (
                  <>
                    <th className="py-3 px-4">{isRTL ? 'משמרת' : 'Shift'}</th>
                    <th className="py-3 px-4">{isRTL ? 'שעות' : 'Hours'}</th>
                  </>
                )}
                <th className="py-3 px-4">{isRTL ? 'הערות מפקד' : 'Notes'}</th>
                <th className="py-3 px-4 text-right">{isRTL ? 'פעולות' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 font-semibold italic">
                    {isRTL ? 'אין עובדים תואמים לפילוח הנוכחי' : 'No employees matching filters.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const sched = emp.daily_assignment;
                  const shiftObj = sched && sched.shift_type_id ? shifts.find(sh => sh.id === sched.shift_type_id) : null;
                  const isSelected = selectedEmployeeIds.includes(emp.employee_id);

                  return (
                    <tr 
                      key={emp.employee_id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 ${
                        isSelected ? 'bg-brand-50/10 dark:bg-brand-950/5' : ''
                      }`}
                    >
                      {hasPermission('schedule.bulk_manage') && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds([...selectedEmployeeIds, emp.employee_id]);
                              } else {
                                setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.employee_id));
                              }
                            }}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                        {emp.display_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-450 font-semibold">
                        {emp.rank} | {emp.role}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                        {emp.organization_unit.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {sched ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border border-black/5"
                            style={{ 
                              backgroundColor: (sched.color || '#2196F3') + '15',
                              color: sched.color || '#2196F3' 
                            }}
                          >
                            <span 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: sched.color || '#2196F3' }}
                            />
                            {sched.status_name}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-semibold italic">
                            {isRTL ? 'טרם שוייך' : 'Not assigned'}
                          </span>
                        )}
                      </td>
                      {settings?.scheduling_mode === 'SHIFT_BASED' && (
                        <>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-800 dark:text-white">
                            {shiftObj?.name || '-'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-2xs font-semibold text-slate-500">
                            {sched?.start_time && sched?.end_time ? `${sched.start_time}-${sched.end_time}` : '-'}
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-xs text-slate-450 truncate max-w-[150px]">
                        {sched?.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('schedule.manage') && (
                            <>
                              <button
                                onClick={() => handleEditOpen({ id: emp.employee_id, name: emp.display_name }, sched)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 dark:border-slate-750 dark:hover:bg-slate-800 dark:text-slate-350 dark:hover:text-white text-xs font-medium cursor-pointer"
                              >
                                <Edit2 className="h-3 w-3" />
                                {sched ? (isRTL ? 'ערוך' : 'Edit') : (isRTL ? 'שבץ' : 'Assign')}
                              </button>
                              {sched && (
                                <button
                                  onClick={() => handleDeleteAssignment(sched.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                  title={isRTL ? 'הסר שיבוץ' : 'Remove Assignment'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                          {hasPermission('employees.history.view') && (
                            <button
                              onClick={() => navigate(`/employees/${emp.employee_id}/history`)}
                              className="p-1 text-slate-400 hover:text-indigo-650 cursor-pointer"
                              title={isRTL ? 'היסטוריית שינויים' : 'View History'}
                            >
                              <Users className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Single edit/assign Modal window dialog */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                {isRTL ? `שיבוץ יומי: ${editingEmployee.name}` : `Daily Assignment: ${editingEmployee.name}`}
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSingleAssignmentSubmit} className="space-y-4 text-xs font-medium text-slate-500">
              
              {/* Daily Status */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">{isRTL ? 'סטטוס זמינות יומי' : 'Daily Availability Status'}</label>
                <select
                  required
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-white"
                >
                  <option value="">{isRTL ? '-- בחר סטטוס --' : '-- Select Status --'}</option>
                  {statuses.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* Shift details fields (Only displayed under SHIFT_BASED settings configuration) */}
              {settings?.scheduling_mode === 'SHIFT_BASED' && (
                <>
                  <div>
                     <label className="block text-slate-400 font-bold mb-1.5">{isRTL ? 'שיוך למשמרת' : 'Shift slot'}</label>
                     <select
                       value={shiftTypeId}
                       onChange={(e) => setShiftTypeId(e.target.value)}
                       className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-white"
                     >
                       <option value="">{isRTL ? '-- ללא משמרת --' : '-- No Shift --'}</option>
                       {shifts.map(sh => (
                         <option key={sh.id} value={sh.id}>{sh.name} ({sh.start_time}-{sh.end_time})</option>
                       ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5">{isRTL ? 'שעת התחלה (אופציונלי)' : 'Start Time (Optional)'}</label>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="08:00"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 font-mono text-center text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5">{isRTL ? 'שעת סיום (אופציונלי)' : 'End Time (Optional)'}</label>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="16:00"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 font-mono text-center text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">{isRTL ? 'הערות מפקד' : 'Commander Notes'}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRTL ? 'רשום הערות אישיות...' : 'Write notes...'}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-905 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isRTL ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 cursor-pointer"
                >
                  {isRTL ? 'שמור שיבוץ' : 'Apply'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. Bulk Assignment Warning Confirmation dialog popup */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-655 dark:bg-brand-950/30 dark:text-brand-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              {isRTL ? 'אישור שיבוץ מרוכז' : 'Confirm Bulk Status Assignment'}
            </h3>

            <p className="text-xs text-slate-550 dark:text-slate-400">
              {isRTL 
                ? `האם אתה בטוח שברצונך לשנות את הסטטוס היומי עבור ${selectedEmployeeIds.length} עובדים בתאריך ${selectedDate}?`
                : `Are you sure you want to allocate the status for ${selectedEmployeeIds.length} employees on date ${selectedDate}?`}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isRTL ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 cursor-pointer"
              >
                {isRTL ? 'אשר ושיבוץ' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
