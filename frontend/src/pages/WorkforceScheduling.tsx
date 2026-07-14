import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  schedulingService, 
  ScheduleStatus, 
  ScheduleSettings, 
  ShiftType, 
  UnitEmployee, 
  DailyDashboardSummary 
} from '../services/schedulingService';
import { 
  Users, Search, Calendar, SlidersHorizontal, 
  Edit2, Trash2, Shield, AlertTriangle, Sparkles, ChevronDown, ChevronUp, GitFork
} from 'lucide-react';
import Unauthorized from './Unauthorized';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function WorkforceScheduling() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

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
            { id: 'shift-uuid-morning', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: t('scheduling:shifts_morning'), start_time: '06:00', end_time: '14:00', active: true },
            { id: 'shift-uuid-afternoon', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: t('scheduling:shifts_afternoon'), start_time: '14:00', end_time: '22:00', active: true },
            { id: 'shift-uuid-night', tenant_id: 't-1', organization_unit_id: selectedUnitId, name: t('scheduling:shifts_night'), start_time: '22:00', end_time: '06:00', active: true }
          ]);
        }
      }
    } catch (err: any) {
      // Local development fallback states
      setStatuses([
        { id: 's-avail', tenant_id: 't-1', code: 'AVAILABLE', name: t('common:available'), category: 'AVAILABLE', color: '#4CAF50', is_active: true, sort_order: 1 },
        { id: 's-sick', tenant_id: 't-1', code: 'SICK', name: t('scheduling:sick'), category: 'SICK', color: '#F44336', is_active: true, sort_order: 2 },
        { id: 's-vac', tenant_id: 't-1', code: 'VACATION', name: t('scheduling:vacation'), category: 'VACATION', color: '#FF9800', is_active: true, sort_order: 3 },
        { id: 's-train', tenant_id: 't-1', code: 'TRAINING', name: t('scheduling:training'), category: 'TRAINING', color: '#9C27B0', is_active: true, sort_order: 4 },
        { id: 's-rein', tenant_id: 't-1', code: 'REINFORCEMENT', name: t('scheduling:reinforcement'), category: 'REINFORCEMENT', color: '#00BCD4', is_active: true, sort_order: 5 }
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
          name: t('scheduling:brigade_hq'),
          code: 'BRIG_HQ',
          children: [
            { id: 'unit-uuid-666', name: t('scheduling:company_a'), code: 'CO_A', children: [] },
            { id: 'unit-uuid-777', name: t('scheduling:company_b'), code: 'CO_B', children: [] }
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
          { unit_id: 'unit-uuid-666', unit_name: t('scheduling:company_a'), total_employees: 10, assigned_employees: 8, unassigned_employees: 2 },
          { unit_id: 'unit-uuid-777', unit_name: t('scheduling:company_b'), total_employees: 12, assigned_employees: 6, unassigned_employees: 6 }
        ]
      });
    }
  };

  const handleEditOpen = (emp: { id: string; name: string }, existing?: any) => {
    if (!hasPermission('schedule.manage')) {
      alert(t('common:no_permission'));
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
    if (!confirm(t('scheduling:confirm_remove'))) return;

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

  const currentUnitName = findUnitName(orgTree, selectedUnitId) || t('scheduling:brigade_hq');

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
      {/* 1. Header with Title and Desc */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-600" />
          {t('scheduling:title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('scheduling:desc')}
        </p>
      </div>

      {/* 1.5. Filter bar (inside a Card) */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Org Tree Selector Dropdown */}
          <div className="relative flex items-center gap-2" ref={treeDropdownRef}>
            <label className="text-xs font-bold text-slate-500">{t('analytics:unit')}:</label>
            <button
              type="button"
              onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
              className="rounded-lg border border-slate-205 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer font-semibold shadow-sm hover:bg-slate-100/50"
            >
              <span>{currentUnitName}</span>
              {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isTreeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-205 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-50 max-h-60 overflow-y-auto animate-fade-in">
                {orgTree.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    {t('common:no_data')}
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
              className="rounded-lg border border-slate-205 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 font-mono text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <Badge variant="info" className="gap-1 text-xs py-1 px-3">
            <Shield className="h-3.5 w-3.5" />
            {settings?.scheduling_mode || 'DIRECT_STATUS'}
          </Badge>
        </div>
      </Card>

      {/* 2. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t('dashboard:total_strength')}</span>
            <Users className="h-5 w-5 text-brand-600" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{totalPersonnelCount}</h4>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t('dashboard:assigned')}</span>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{assignedCount}</h4>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t('scheduling:not_assigned')}</span>
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>
          <h4 className="font-heading text-2xl font-bold mt-2 text-slate-800 dark:text-white">{unassignedCount}</h4>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400">{t('analytics:distribution')}</span>
          <div className="mt-2 space-y-1 max-h-16 overflow-y-auto pr-1">
            {Object.entries(statusDistribution).map(([name, val]) => (
              <div key={name} className="flex justify-between text-2xs text-slate-500 font-medium">
                <span>{name}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 2.5 Child Units Breakdown */}
      {dashboardSummary?.child_units && dashboardSummary.child_units.length > 0 && (
        <Card className="p-5">
          <h3 className="font-heading text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            {t('analytics:unit_breakdown')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dashboardSummary.child_units.map(child => (
              <div 
                key={child.unit_id} 
                onClick={() => setSelectedUnitId(child.unit_id)}
                className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-105 dark:border-slate-850 hover:border-brand-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                    <GitFork className="h-4 w-4 text-brand-500" />
                    {child.unit_name}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>{t('dashboard:total_strength')}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{child.total_employees}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t('dashboard:assigned')}:</span>
                      <span className="font-bold text-emerald-600">{child.assigned_employees}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t('scheduling:not_assigned')}:</span>
                      <span className="font-bold text-rose-500">{child.unassigned_employees}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SHIFT_BASED Sub-Dashboard shifts counters */}
      {settings?.scheduling_mode === 'SHIFT_BASED' && (
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-400 mb-2.5 block">{t('scheduling:shift_settings')}</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(shiftDistribution).map(([name, count]) => (
              <div key={name} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-105 dark:border-slate-850 flex items-center justify-between">
                <span className="text-2xs font-semibold text-slate-500">{name}</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Bulk Actions Widget */}
      {hasPermission('schedule.bulk_manage') && selectedEmployeeIds.length > 0 && (
        <div className="bg-brand-50/40 dark:bg-brand-950/10 border border-brand-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {`${selectedEmployeeIds.length} ${t('scheduling:employees_selected')}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={bulkStatusId}
              onChange={(e) => setBulkStatusId(e.target.value)}
              className="rounded-lg border border-slate-205 bg-white dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none text-slate-800 dark:text-white"
            >
              <option value="">{t('scheduling:choose_status')}</option>
              {statuses.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>

            <Button
              onClick={() => setShowBulkConfirm(true)}
              disabled={!bulkStatusId}
              size="sm"
            >
              {t('scheduling:apply_bulk')}
            </Button>
          </div>
        </div>
      )}

      {/* 4. Filters & Searching */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            placeholder={t('employees:search_placeholder')}
          />
        </div>

        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4.5 w-4.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-205 bg-white dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none text-slate-800 dark:text-white"
          >
            <option value="ALL">{t('scheduling:all_statuses')}</option>
            <option value="UNASSIGNED">{t('scheduling:not_assigned')}</option>
            {statuses.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* 5. Main Planning Table */}
      <Card className="overflow-hidden">
        {isMobile ? (
          /* Mobile View */
          <div className="space-y-4 p-4">
            {filteredEmployees.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-semibold italic">
                {t('employees:no_employees')}
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const sched = emp.daily_assignment;
                const shiftObj = sched && sched.shift_type_id ? shifts.find(sh => sh.id === sched.shift_type_id) : null;
                const isSelected = selectedEmployeeIds.includes(emp.employee_id);

                return (
                  <div 
                    key={emp.employee_id} 
                    className={`p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 transition-colors ${
                      isSelected 
                        ? 'bg-brand-50/15 border-brand-200 dark:bg-brand-950/10 dark:border-brand-900' 
                        : 'bg-slate-50/30 dark:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {hasPermission('schedule.bulk_manage') && (
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
                            className="rounded text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{emp.display_name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{emp.rank} | {emp.role}</p>
                        </div>
                      </div>

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
                        <span className="text-[10px] text-rose-500 font-semibold italic bg-rose-50 dark:bg-rose-950/10 px-2 py-0.5 rounded-full">
                          {t('scheduling:not_assigned')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-505 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="block text-slate-400">{t('analytics:unit')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-355">{emp.organization_unit.name}</span>
                      </div>
                      {settings?.scheduling_mode === 'SHIFT_BASED' && (
                        <div>
                          <span className="block text-slate-400">{t('scheduling:shift_name')}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-355">
                            {shiftObj?.name || '-'} {sched?.start_time && sched?.end_time ? ` (${sched.start_time}-${sched.end_time})` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {sched?.notes && (
                      <div className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg">
                        <span className="block text-2xs text-slate-400 uppercase font-semibold mb-0.5">{t('scheduling:notes')}</span>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{sched.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      {hasPermission('schedule.manage') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOpen({ id: emp.employee_id, name: emp.display_name }, sched)}
                            className="h-8 text-2xs px-3"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            {sched ? t('buttons:edit') : t('scheduling:assign')}
                          </Button>
                          {sched && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAssignment(sched.id)}
                              className="h-8 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              {t('buttons:delete')}
                            </Button>
                          )}
                        </>
                      )}
                      {hasPermission('employees.history.view') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/employees/${emp.employee_id}/history`)}
                          className="h-8 px-3"
                          title={t('employees:history_title')}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {t('employees:history_title')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop / Tablet View */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {hasPermission('schedule.bulk_manage') && (
                    <TableHead className="w-12 text-center">
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
                    </TableHead>
                  )}
                  <TableHead>{t('employees:employee')}</TableHead>
                  <TableHead>{t('employees:rank_role')}</TableHead>
                  <TableHead>{t('analytics:unit')}</TableHead>
                  <TableHead>{t('scheduling:daily_status')}</TableHead>
                  {settings?.scheduling_mode === 'SHIFT_BASED' && (
                    <>
                      <TableHead>{t('scheduling:shift_name')}</TableHead>
                      <TableHead>{t('scheduling:hours')}</TableHead>
                    </>
                  )}
                  <TableHead>{t('scheduling:notes')}</TableHead>
                  <TableHead className="text-right">{t('common:actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-slate-400 font-semibold italic">
                      {t('employees:no_employees')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    const sched = emp.daily_assignment;
                    const shiftObj = sched && sched.shift_type_id ? shifts.find(sh => sh.id === sched.shift_type_id) : null;
                    const isSelected = selectedEmployeeIds.includes(emp.employee_id);

                    return (
                      <TableRow 
                        key={emp.employee_id} 
                        className={isSelected ? 'bg-brand-50/10 dark:bg-brand-950/5' : ''}
                      >
                        {hasPermission('schedule.bulk_manage') && (
                          <TableCell className="text-center">
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
                          </TableCell>
                        )}
                        <TableCell className="font-bold text-slate-800 dark:text-white">
                          {emp.display_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-450 font-semibold">
                          {emp.rank} | {emp.role}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-semibold">
                          {emp.organization_unit.name}
                        </TableCell>
                        <TableCell>
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
                            <span className="text-xs text-red-505 font-semibold italic">
                              {t('scheduling:not_assigned')}
                            </span>
                          )}
                        </TableCell>
                        {settings?.scheduling_mode === 'SHIFT_BASED' && (
                          <>
                            <TableCell className="text-xs font-medium text-slate-800 dark:text-white">
                              {shiftObj?.name || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-2xs font-semibold text-slate-505">
                              {sched?.start_time && sched?.end_time ? `${sched.start_time}-${sched.end_time}` : '-'}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-xs text-slate-450 truncate max-w-[150px]">
                          {sched?.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPermission('schedule.manage') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOpen({ id: emp.employee_id, name: emp.display_name }, sched)}
                                  className="h-8 py-1 px-2.5 text-xs"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  {sched ? t('buttons:edit') : t('scheduling:assign')}
                                </Button>
                                {sched && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAssignment(sched.id)}
                                    className="h-8 w-8 text-slate-450 hover:text-red-500"
                                    title={t('scheduling:remove_assignment')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            {hasPermission('employees.history.view') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/employees/${emp.employee_id}/history`)}
                                className="h-8 w-8 text-slate-450 hover:text-indigo-650"
                                title={t('employees:history_title')}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 6. Single edit/assign Modal window dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle>
              {editingEmployee ? `${t('scheduling:daily_assignment')}: ${editingEmployee.name}` : ''}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSingleAssignmentSubmit} className="space-y-4 text-xs font-medium text-slate-500">
            {/* Daily Status */}
            <div>
              <label className="block text-slate-450 font-bold mb-1.5">{t('scheduling:daily_status')}</label>
              <select
                required
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="">{t('scheduling:choose_status')}</option>
                {statuses.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Shift details fields (Only displayed under SHIFT_BASED settings configuration) */}
            {settings?.scheduling_mode === 'SHIFT_BASED' && (
              <>
                <div>
                   <label className="block text-slate-450 font-bold mb-1.5">{t('scheduling:shift_name')}</label>
                   <select
                     value={shiftTypeId}
                     onChange={(e) => setShiftTypeId(e.target.value)}
                     className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
                   >
                     <option value="">{t('scheduling:no_shift')}</option>
                     {shifts.map(sh => (
                       <option key={sh.id} value={sh.id}>{sh.name} ({sh.start_time}-{sh.end_time})</option>
                     ))}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-450 font-bold mb-1.5">{t('scheduling:start_time_optional')}</label>
                    <Input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="08:00"
                      className="font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-450 font-bold mb-1.5">{t('scheduling:end_time_optional')}</label>
                    <Input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="16:00"
                      className="font-mono text-center"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label className="block text-slate-450 font-bold mb-1.5">{t('scheduling:notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('scheduling:notes_placeholder')}
                rows={3}
                className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEmployee(null)}
              >
                {t('buttons:cancel')}
              </Button>
              <Button
                type="submit"
              >
                {t('scheduling:save_assignment')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Bulk Assignment Warning Confirmation dialog popup */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent className="max-w-sm p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>
              {t('scheduling:confirm_bulk')}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {`${t('scheduling:confirm_bulk_msg')} ${selectedEmployeeIds.length} ${t('scheduling:employees_count')} ${selectedDate}?`}
          </p>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkConfirm(false)}
              className="flex-1"
            >
              {t('buttons:cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleBulkSubmit}
              className="flex-1"
            >
              {t('buttons:confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}



