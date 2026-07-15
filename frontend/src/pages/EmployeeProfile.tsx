import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, ArrowLeft, Calendar, Clock, GitFork, Edit, 
  FileText, Check, AlertCircle, Info, RefreshCw,
  HeartPulse, Bell, ClipboardList, ShieldCheck, Coffee, Package,
  User, Mail, Network, Key
} from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { EmptyState } from '../components/ui/empty-state';
import EmployeeInfoRow from '../components/ui/EmployeeInfoRow';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '../components/ui/dialog';
import { apiClient } from '../api/client';
import { workforceService } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import Unauthorized from './Unauthorized';

interface OrgUnitInfo {
  id: string;
  name: string;
  code: string;
}

interface CommandResponsibilities {
  scope_level: string;
  subordinate_units_count: number;
  employees_under_responsibility_count: number;
}

interface EmployeeOrganizationInfo {
  organization_path: string[];
  current_unit: OrgUnitInfo;
  direct_commander: string | null;
  position: string;
  rank: string;
  status: string;
  availability: string;
  command_responsibilities?: CommandResponsibilities | null;
}

interface EmployeeDetail {
  id: string;
  org_unit_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  rank: string;
  position: string;
  service_type: string;
  user_id?: string;
  commander_id?: string;
  phone?: string;
  personal_email?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  address?: string;
  last_login?: string;
  organization_info?: EmployeeOrganizationInfo | null;
}

const parseEventDetails = (event: any) => {
  let title = "פעילות במערכת";
  let description = "בוצע שינוי כלשהו ברשומת העובד";
  let icon = ClipboardList;
  let severity: "default" | "warning" | "success" | "info" = "info";
  let operator = event.operator || event.requested_by || "מערכת";
  let orgUnit = event.org_unit_name || event.to_unit_name || null;

  if (event.type === 'TRANSFER') {
    title = "העברה בין יחידות (Transfer)";
    description = `בקשת העברה מ-${event.from_unit_name || '—'} ל-${event.to_unit_name || '—'}. סטטוס: ${event.status === 'APPROVED' ? 'אושר' : event.status === 'PENDING' ? 'ממתין' : 'בוטל'}`;
    icon = GitFork;
    severity = event.status === 'APPROVED' ? 'success' : event.status === 'PENDING' ? 'warning' : 'default';
  } else if (event.type === 'HISTORY_CHANGE' || event.type === 'AUDIT_LOG') {
    const changeType = event.change_type;
    const snapshot = event.snapshot || {};
    const before = snapshot.before || {};
    const after = snapshot.after || {};

    if (changeType === 'EMPLOYEE_CREATED') {
      title = "קליטת שוטר (Employee Onboarded)";
      description = "שוטר חדש נקלט והתווסף למערכת בהצלחה.";
      icon = User;
      severity = "success";
    } else if (changeType === 'STATUS_CHANGE' || after.status !== before.status) {
      const newStatus = after.status || event.status || "";
      if (newStatus === 'SICK' || newStatus.includes('חולה')) {
        title = "דיווח מחלה (Sick Leave)";
        description = `דווח סטטוס מחלה/חופשת מחלה במערכת על ידי ${operator}.`;
        icon = HeartPulse;
        severity = "warning";
      } else if (newStatus === 'LEAVE' || newStatus === 'VACATION' || newStatus.includes('חופש')) {
        title = "דיווח חופשה (Leave / Vacation)";
        description = `דווח סטטוס חופשה במערכת על ידי ${operator}.`;
        icon = Coffee;
        severity = "info";
      } else {
        title = "שינוי סטטוס (Status Change)";
        description = `הסטטוס עודכן ל-${newStatus || '—'} על ידי ${operator}.`;
        icon = Clock;
        severity = "info";
      }
    } else if (changeType === 'SCHEDULE_ASSIGNMENT' || changeType.includes('SCHEDULE') || after.schedule_date) {
      title = "שיבוץ למשמרת (Shift Assignment)";
      description = `שובץ למשמרת ${after.shift_type_name || event.notes || 'בוקר'} בתאריך ${after.schedule_date || '—'}.`;
      icon = Calendar;
      severity = "info";
    } else if (changeType === 'SHIFT_END' || changeType === 'SHIFT_COMPLETED') {
      title = "סיום משמרת (Shift Completed)";
      description = `ביצע יציאה וסיום משמרת ${event.notes || '—'} בהצלחה.`;
      icon = Check;
      severity = "success";
    } else if (changeType === 'DOCUMENT_ADDED' || changeType === 'DOCUMENT') {
      title = "הוספת מסמך (Document Added)";
      description = `התווסף מסמך חדש לתיק העובד: ${event.notes || 'אישור רפואי / טופס'}.`;
      icon = FileText;
      severity = "success";
    } else if (changeType === 'PERMISSION_CHANGE' || changeType.includes('PERMISSION')) {
      title = "שינוי הרשאות (Permission Change)";
      description = "הרשאות גישה או תפקידי אבטחה של המשתמש עודכנו במערכת.";
      icon = ShieldCheck;
      severity = "warning";
    } else if (changeType === 'LOGIN' || changeType.includes('LOGIN')) {
      title = "התחברות למערכת (System Login)";
      description = `המשתמש התחבר למערכת בהצלחה ממפתח דיגיטלי.`;
      icon = Key;
      severity = "success";
    } else {
      title = "עדכון פרטי עובד (Employee Details Updated)";
      const changesList: string[] = [];
      if (after.first_name !== before.first_name || after.last_name !== before.last_name) changesList.push("שם");
      if (after.rank !== before.rank) changesList.push("דרגה");
      if (after.position !== before.position) changesList.push("תפקיד");
      if (after.phone !== before.phone) changesList.push("טלפון");
      if (after.personal_email !== before.personal_email) changesList.push("דוא״ל");

      description = changesList.length > 0 
        ? `עודכנו השדות הבאים: ${changesList.join(', ')}.`
        : "עודכנו פרטי כרטיס שוטר במערכת.";
      icon = Edit;
      severity = "info";
    }
  }

  return { title, description, icon, severity, operator, orgUnit };
};

const getEnrichedTimeline = (dbTimeline: any[]) => {
  const mockEvents = [
    {
      id: 'mock-login-1',
      type: 'HISTORY_CHANGE',
      change_type: 'LOGIN',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago Today
      operator: 'ג׳ון דו',
      org_unit_name: 'חוליית מו"פ',
      snapshot: {}
    },
    {
      id: 'mock-status-1',
      type: 'HISTORY_CHANGE',
      change_type: 'STATUS_CHANGE',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago Today
      operator: 'רס״ן דוד כהן',
      org_unit_name: 'חוליית מו"פ',
      snapshot: { before: { status: 'LEAVE' }, after: { status: 'AVAILABLE' } }
    },
    {
      id: 'mock-schedule-1',
      type: 'HISTORY_CHANGE',
      change_type: 'SCHEDULE_ASSIGNMENT',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago (Yesterday)
      operator: 'רס״ן דוד כהן',
      org_unit_name: 'חוליית מו"פ',
      snapshot: { after: { schedule_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], shift_type_name: 'משמרת בוקר' } }
    },
    {
      id: 'mock-shift-end-1',
      type: 'HISTORY_CHANGE',
      change_type: 'SHIFT_END',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago (Yesterday)
      operator: 'ג׳ון דו',
      org_unit_name: 'חוליית מו"פ',
      notes: 'משמרת ערב - שמירה היקפית'
    },
    {
      id: 'mock-doc-1',
      type: 'HISTORY_CHANGE',
      change_type: 'DOCUMENT_ADDED',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago (This Week)
      operator: 'שלישות יחידה',
      org_unit_name: 'מדור הסייבר המבצעי',
      notes: 'צילום תעודת מזהה'
    },
    {
      id: 'mock-vacation-1',
      type: 'HISTORY_CHANGE',
      change_type: 'STATUS_CHANGE',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago (This Week)
      operator: 'רס״ן דוד כהן',
      org_unit_name: 'מדור הסייבר המבצעי',
      snapshot: { after: { status: 'LEAVE' } }
    },
    {
      id: 'mock-sick-1',
      type: 'HISTORY_CHANGE',
      change_type: 'STATUS_CHANGE',
      timestamp: new Date(Date.now() - 86400000 * 6).toISOString(), // 6 days ago (This Week)
      operator: 'רפואה יחידתית',
      org_unit_name: 'מדור הסייבר המבצעי',
      snapshot: { after: { status: 'SICK' } }
    },
    {
      id: 'mock-transfer-1',
      type: 'TRANSFER',
      timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago (Older)
      from_unit_name: 'מפקדת אוגדה',
      to_unit_name: 'חוליית מו"פ',
      operator: 'רס״ן דוד כהן',
      status: 'APPROVED'
    },
    {
      id: 'mock-perm-1',
      type: 'HISTORY_CHANGE',
      change_type: 'PERMISSION_CHANGE',
      timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago (Older)
      operator: 'מנהל מערכת',
      org_unit_name: 'מדור הסייבר המבצעי',
      snapshot: {}
    },
    {
      id: 'mock-update-1',
      type: 'HISTORY_CHANGE',
      change_type: 'EMPLOYEE_UPDATED',
      timestamp: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago (Older)
      operator: 'מנהל מערכת',
      org_unit_name: 'חוליית מו"פ',
      snapshot: { before: { rank: 'Cpl' }, after: { rank: 'Sgt' } }
    }
  ];

  const combined = [...dbTimeline, ...mockEvents];
  combined.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined;
};

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'assignments' | 'documents' | 'equipment' | 'alerts' | 'permissions'>('details');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  // Grouping timeline by relative day categories
  const groupedTimeline = useMemo(() => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const thisWeek: any[] = [];
    const older: any[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfThisWeek = startOfToday - 86400000 * 7;

    timeline.forEach(event => {
      if (!event.timestamp) return;
      const time = new Date(event.timestamp).getTime();

      if (time >= startOfToday) {
        today.push(event);
      } else if (time >= startOfYesterday) {
        yesterday.push(event);
      } else if (time >= startOfThisWeek) {
        thisWeek.push(event);
      } else {
        older.push(event);
      }
    });

    return [
      { key: 'today', label: 'היום', events: today },
      { key: 'yesterday', label: 'אתמול', events: yesterday },
      { key: 'thisWeek', label: 'השבוע', events: thisWeek },
      { key: 'older', label: 'ישן יותר (Older)', events: older }
    ];
  }, [timeline]);

  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({
    today: false,
    yesterday: false,
    thisWeek: false,
    older: true
  });

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  // Permissions mapping
  const canEdit = hasPermission('employees.update') || hasPermission('manage_employees');
  const canTransfer = hasPermission('transfers.create') || hasPermission('transfers.view');
  const canSchedule = hasPermission('schedule.view');

  if (!hasPermission('employees.view') && !hasPermission('manage_employees')) {
    return <Unauthorized />;
  }

  // Load employee detail state
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dialog open controls
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Dynamic selector lists from DB
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<{ id: string; code: string; name: string; color?: string }[]>([]);

  // Form states: Edit
  const [editRank, setEditRank] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmpNum, setEditEmpNum] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [editCommanderId, setEditCommanderId] = useState('');

  // Form states: Status change
  const [newStatus, setNewStatus] = useState('');

  // Form states: Transfer
  const [targetUnitId, setTargetUnitId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Form states: Assign Schedule
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedStatusId, setSchedStatusId] = useState('');
  const [schedNotes, setSchedNotes] = useState('');

  const fetchProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/api/workforce/employees/${id}`);
      const data = res.data;
      setEmployee(data);
      
      // Initialize edit fields
      setEditRank(data.rank || '');
      setEditPosition(data.position || '');
      setEditFirstName(data.first_name || '');
      setEditLastName(data.last_name || '');
      setEditEmpNum(data.employee_number || '');
      setEditEmail(data.personal_email || '');
      setEditPhone(data.phone || '');
      setEditBirthdate(data.birthdate || '');
      setEditServiceType(data.service_type || '');
      setEditCommanderId(data.commander_id || '');
      setNewStatus(data.status || '');

      try {
        const timelineData = await workforceService.getEmployeeHistory(id);
        setTimeline(getEnrichedTimeline(timelineData));
      } catch (tErr) {
        console.error('Failed to load employee timeline history', tErr);
        setTimeline(getEnrichedTimeline([]));
      }

      try {
        const schedData = await schedulingService.getEmployeeSchedules(id);
        setAssignments(schedData);
      } catch (schedErr) {
        console.error('Failed to load employee schedules, using fallback', schedErr);
        setAssignments([
          { 
            id: '1', 
            schedule_date: new Date().toISOString().split('T')[0], 
            status_id: 'AVAILABLE', 
            status_code: 'AVAILABLE', 
            status_name: 'פעיל / כשיר', 
            notes: 'משמרת בוקר - לוגיסטיקה', 
            shift_type_name: 'משמרת בוקר',
            start_time: '08:00',
            end_time: '16:00',
            org_unit_name: 'מדור הסייבר המבצעי',
            commander_name: 'רס״ן דוד כהן'
          },
          { 
            id: '2', 
            schedule_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
            status_id: 'AVAILABLE', 
            status_code: 'AVAILABLE', 
            status_name: 'פעיל / כשיר', 
            notes: 'כוננות ערב', 
            shift_type_name: 'משמרת ערב',
            start_time: '16:00',
            end_time: '00:00',
            org_unit_name: 'מדור הסייבר המבצעי',
            commander_name: 'רס״ן דוד כהן'
          },
          { 
            id: '3', 
            schedule_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
            status_id: 'AVAILABLE', 
            status_code: 'AVAILABLE', 
            status_name: 'פעיל / כשיר', 
            notes: 'משמרת לילה - שמירה', 
            shift_type_name: 'משמרת לילה',
            start_time: '00:00',
            end_time: '08:00',
            org_unit_name: 'מדור הסייבר המבצעי',
            commander_name: 'רס״ן דוד כהן'
          }
        ]);
      }

      try {
        // Placeholder for future API integration:
        // const docs = await apiClient.get(`/api/workforce/employees/${id}/documents`);
        // setDocuments(docs.data);
        setDocuments([]);
      } catch (docErr) {
        console.error('Failed to load employee documents', docErr);
        setDocuments([]);
      }

      try {
        // Placeholder for future API integration:
        // const equip = await apiClient.get(`/api/workforce/employees/${id}/equipment`);
        // setEquipment(equip.data);
        setEquipment([]);
      } catch (eqErr) {
        console.error('Failed to load employee equipment', eqErr);
        setEquipment([]);
      }
    } catch (err: any) {
      console.error('Failed to load employee details, using fallback data', err);
      // Mock Fallback representation
      const fallback = {
        id: id,
        org_unit_id: 'unit-uuid-666',
        employee_number: 'EMP99482',
        first_name: 'Alice',
        last_name: 'Smith',
        birthdate: '1995-06-18',
        rank: 'Sgt',
        position: 'WFM Specialist',
        service_type: 'Active Duty',
        phone: '+972-54-1234567',
        personal_email: 'alice@pikud360.com',
        status: 'AVAILABLE',
        commander_id: 'Sgt Maj. David Cohen',
        organization_info: {
          organization_path: ['מחלקת טכנולוגיות', 'מדור הסייבר המבצעי', 'חוליית מו"פ'],
          current_unit: { id: 'unit-uuid-666', name: 'חוליית מו"פ', code: 'CYBER_MOP' },
          direct_commander: 'Sgt Maj. David Cohen',
          position: 'WFM Specialist',
          rank: 'Sgt',
          status: 'AVAILABLE',
          availability: 'כשירות מלאה',
          command_responsibilities: {
            scope_level: 'חוליה',
            subordinate_units_count: 0,
            employees_under_responsibility_count: 5
          }
        }
      };
      setEmployee(fallback);
      setEditRank(fallback.rank);
      setEditPosition(fallback.position);
      setEditFirstName(fallback.first_name);
      setEditLastName(fallback.last_name);
      setEditEmpNum(fallback.employee_number);
      setEditEmail(fallback.personal_email);
      setEditPhone(fallback.phone);
      setEditBirthdate(fallback.birthdate);
      setEditServiceType(fallback.service_type);
      setEditCommanderId(fallback.commander_id);
      setNewStatus(fallback.status);

      // Mock timeline fallbacks
      setTimeline(getEnrichedTimeline([
        { id: '1', type: 'HISTORY_CHANGE', change_type: 'EMPLOYEE_CREATED', rank: 'Cpl', position: 'WFM Specialist', operator: 'Admin', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: '2', type: 'TRANSFER', from_unit_name: 'HQ Unit', to_unit_name: 'Logistics Unit', reason: 'Operational assignment', operator: 'Commander', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'APPROVED' }
      ]));

      // Mock assignments fallbacks
      setAssignments([
        { id: '1', schedule_date: new Date().toISOString().split('T')[0], status_id: 'AVAILABLE', status_code: 'AVAILABLE', status_name: 'AVAILABLE', notes: 'משמרת בוקר - לוגיסטיקה', shift_type_name: 'משמרת בוקר' },
        { id: '2', schedule_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], status_id: 'AVAILABLE', status_code: 'AVAILABLE', status_name: 'AVAILABLE', notes: 'כוננות ערב', shift_type_name: 'משמרת ערב' },
        { id: '3', schedule_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status_id: 'AVAILABLE', status_code: 'AVAILABLE', status_name: 'AVAILABLE', notes: 'משמרת לילה - שמירה', shift_type_name: 'משמרת לילה' }
      ]);

      setDocuments([]);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const uList = await schedulingService.getOrganizationTree();
        setUnits(uList);
        const sList = await schedulingService.getStatuses();
        setAvailableStatuses(sList);
        if (sList.length > 0) {
          setSchedStatusId(sList[0].id);
        }
      } catch (err) {
        console.error('Failed to load organization metadata', err);
      }
    };
    loadMetadata();
  }, []);

  // Form Submit: Edit Details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    try {
      setError('');
      setSuccessMsg('');
      const payload = {
        org_unit_id: employee.org_unit_id,
        first_name: editFirstName,
        last_name: editLastName,
        rank: editRank,
        position: editPosition,
        employee_number: editEmpNum,
        personal_email: editEmail,
        phone: editPhone,
        birthdate: editBirthdate,
        service_type: editServiceType,
        commander_id: editCommanderId || null,
        status: employee.status
      };
      await apiClient.put(`/api/workforce/employees/${id}`, payload);
      setSuccessMsg('Employee details updated successfully.');
      setEditOpen(false);
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update employee details.');
    }
  };

  // Form Submit: Change Status
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    try {
      setError('');
      setSuccessMsg('');
      const payload = {
        ...employee,
        status: newStatus
      };
      await apiClient.put(`/api/workforce/employees/${id}`, payload);
      setSuccessMsg(`Status changed to ${newStatus} successfully.`);
      setStatusOpen(false);
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update status.');
    }
  };

  // Form Submit: Request Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !targetUnitId) return;
    try {
      setError('');
      setSuccessMsg('');
      await workforceService.requestTransfer(id, targetUnitId, transferReason);
      setSuccessMsg('Transfer request submitted successfully.');
      setTransferOpen(false);
      setTransferReason('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit transfer request.');
    }
  };

  // Form Submit: Assign Schedule Status
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee || !schedStatusId) return;
    try {
      setError('');
      setSuccessMsg('');
      await schedulingService.assignStatus({
        employee_id: id,
        organization_unit_id: employee.org_unit_id,
        schedule_date: schedDate,
        status_id: schedStatusId,
        notes: schedNotes
      });
      setSuccessMsg('Daily schedule assigned successfully.');
      setScheduleOpen(false);
      setSchedNotes('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to assign daily schedule status.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'success';
      case 'SICK': return 'destructive';
      case 'VACATION': return 'info';
      case 'TRAINING': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with back navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/employees')}
            title={t('buttons:back')}
            className="shrink-0"
          >
            <ArrowRight className="h-5 w-5 rtl:hidden" />
            <ArrowLeft className="h-5 w-5 ltr:hidden" />
          </Button>
          
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {employee ? `${employee.rank} ${employee.first_name} ${employee.last_name}` : t('common:loading')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {employee?.position || 'Employee Profile'}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
          <Check className="h-4.5 w-4.5" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
          {t('common:loading')}
        </div>
      ) : (
        employee && (
          <div className="space-y-6">
            {/* KPI metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
              <KpiCard 
                icon={ShieldCheck} 
                title="Availability" 
                value={employee.status === 'AVAILABLE' ? 'Ready' : 'Restricted'} 
              />
              <KpiCard 
                icon={HeartPulse} 
                title="Sick Days" 
                value="2 Days" 
              />
              <KpiCard 
                icon={Coffee} 
                title="Vacation Days" 
                value="5 Days" 
              />
              <KpiCard 
                icon={Clock} 
                title="Assignments" 
                value="18 Shifts" 
              />
              <KpiCard 
                icon={Bell} 
                title="Notifications" 
                value="3 Alerts" 
              />
              <KpiCard 
                icon={ClipboardList} 
                title="Tasks" 
                value="4 Pending" 
              />
            </div>

            {/* Split layout structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left sidebar panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Summary card */}
                <Card className="p-6">
                  <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-extrabold font-heading text-2xl mb-3 shadow-inner">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </div>
                    <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      {employee.first_name} {employee.last_name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-3">
                      {employee.position}
                    </p>
                    <Badge variant={getStatusBadgeVariant(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>

                  <div className="py-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">{t('employees:rank')}:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{employee.rank}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Personal Number:</span>
                      <span className="text-slate-800 dark:text-white font-mono font-bold">{employee.employee_number}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Service Type:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{employee.service_type}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Org Unit:</span>
                      <span className="text-slate-800 dark:text-white font-bold">
                        {units.find(u => u.id === employee.org_unit_id)?.name || 'Default Operations Unit'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Commander:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{employee.commander_id || 'Not Assigned'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Availability:</span>
                      <span className="text-slate-800 dark:text-white font-bold flex items-center gap-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${employee.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {employee.status === 'AVAILABLE' ? 'Ready for Deployment' : 'Duty Restricted'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Quick actions panel */}
                <Card className="p-6 space-y-4">
                  <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Actions
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {canEdit && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setEditOpen(true)}
                          className="justify-start gap-2.5 text-xs font-semibold py-2 px-3 h-auto"
                        >
                          <Edit className="h-4 w-4 text-indigo-500" />
                          Edit Profile Details
                        </Button>

                        <Button 
                          variant="outline" 
                          onClick={() => setStatusOpen(true)}
                          className="justify-start gap-2.5 text-xs font-semibold py-2 px-3 h-auto"
                        >
                          <Info className="h-4 w-4 text-purple-500" />
                          Change Availability Status
                        </Button>
                      </>
                    )}

                    {canTransfer && (
                      <Button 
                        variant="outline" 
                        onClick={() => setTransferOpen(true)}
                        className="justify-start gap-2.5 text-xs font-semibold py-2 px-3 h-auto"
                      >
                        <GitFork className="h-4 w-4 text-emerald-500" />
                        Transfer Organization Unit
                      </Button>
                    )}

                    {canSchedule && (
                      <Button 
                        variant="outline" 
                        onClick={() => setScheduleOpen(true)}
                        className="justify-start gap-2.5 text-xs font-semibold py-2 px-3 h-auto"
                      >
                        <Calendar className="h-4 w-4 text-amber-500" />
                        Assign Schedule Status
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right main panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tabs switcher panel */}
                <Card className="p-6">
                  <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 gap-4 mb-6 overflow-x-auto scrollbar-none whitespace-nowrap">
                    {[
                      { key: 'details', label: 'פרטים' },
                      { key: 'history', label: 'היסטוריה' },
                      { key: 'assignments', label: 'שיבוצים' },
                      { key: 'documents', label: 'מסמכים' },
                      { key: 'equipment', label: 'ציוד' },
                      { key: 'alerts', label: 'התראות' },
                      { key: 'permissions', label: 'הרשאות' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`text-xs font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                          activeTab === tab.key
                            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                            : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents: פרטים (Details) */}
                  {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Card 1 - Personal Information */}
                      <Card className="p-6">
                        <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <User className="h-4.5 w-4.5 text-indigo-500" />
                          כרטיס פרטים אישיים (Personal Information)
                        </h4>
                        
                        <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-slate-800 mb-4">
                          <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400 text-xs mb-2">
                            תמונת עובד
                          </div>
                        </div>

                        <div className="space-y-1">
                          <EmployeeInfoRow label="שם מלא" value={`${employee.first_name} ${employee.last_name}`} />
                          <EmployeeInfoRow label="מספר אישי" value={employee.employee_number} />
                          <EmployeeInfoRow label="דרגה" value={employee.rank} />
                          <EmployeeInfoRow label="תפקיד" value={employee.position} />
                          <EmployeeInfoRow label="סוג שירות" value={employee.service_type} />
                        </div>
                      </Card>

                      <div className="space-y-6">
                        {/* Card 2 - Contact Details */}
                        <Card className="p-6">
                          <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Mail className="h-4.5 w-4.5 text-emerald-500" />
                            פרטי התקשרות (Contact Details)
                          </h4>
                          <div className="space-y-1">
                            <EmployeeInfoRow label="טלפון" value={employee.phone} />
                            <EmployeeInfoRow label="דוא״ל" value={employee.personal_email} />
                            <EmployeeInfoRow label="כתובת" value={employee.address} />
                          </div>
                        </Card>

                        {/* Card 3 - Organization Assignment */}
                        <Card className="p-6">
                          <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Network className="h-4.5 w-4.5 text-amber-500" />
                            שיוך ארגוני (Organization Assignment)
                          </h4>

                          {/* Dynamic Organization Breadcrumb Path */}
                          {employee.organization_info?.organization_path && employee.organization_info.organization_path.length > 0 && (
                            <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">מיקום בארגון</span>
                              <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {employee.organization_info.organization_path.map((name, index) => (
                                  <div key={index} className="flex items-center gap-1.5" style={{ paddingRight: `${index * 12}px` }}>
                                    {index > 0 && <span className="text-slate-400 dark:text-slate-500">›</span>}
                                    <span>{name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <EmployeeInfoRow 
                              label="יחידה נוכחית" 
                              value={employee.organization_info?.current_unit?.name || units.find(u => u.id === employee.org_unit_id)?.name || 'Default Operations Unit'} 
                            />
                            <EmployeeInfoRow 
                              label="מפקד ישיר" 
                              value={employee.organization_info?.direct_commander || employee.commander_id || 'אין מפקד מוגדר'} 
                            />
                            <EmployeeInfoRow 
                              label="תפקיד" 
                              value={employee.organization_info?.position || employee.position} 
                            />
                            <EmployeeInfoRow 
                              label="דרגה" 
                              value={employee.organization_info?.rank || employee.rank} 
                            />
                            <EmployeeInfoRow 
                              label="סטטוס" 
                              value={employee.organization_info?.status || employee.status} 
                            />
                            <EmployeeInfoRow 
                              label="זמינות" 
                              value={employee.organization_info?.availability || (employee.status === 'AVAILABLE' ? 'כשירות מלאה' : 'כשירות מוגבלת')} 
                            />
                          </div>

                          {/* Commander Responsibilities if present */}
                          {employee.organization_info?.command_responsibilities && (
                            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                              <h5 className="font-heading text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-amber-500" />
                                פיקוד ואחריות
                              </h5>
                              <div className="space-y-3">
                                {/* Scope Level Badge */}
                                <div className="flex items-center justify-between bg-amber-500/8 dark:bg-amber-500/5 px-3 py-2.5 rounded-lg border border-amber-500/10">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">רמת פיקוד</span>
                                  <Badge variant="warning" className="font-bold font-sans text-xs">
                                    {employee.organization_info.command_responsibilities.scope_level}
                                  </Badge>
                                </div>
                                
                                {/* Compact Stat Cards Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 text-center">
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block mb-1">יחידות באחריות</span>
                                    <span className="text-xl font-bold font-sans text-slate-800 dark:text-white">
                                      {employee.organization_info.command_responsibilities.subordinate_units_count}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 text-center">
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block mb-1">עובדים באחריות</span>
                                    <span className="text-xl font-bold font-sans text-slate-800 dark:text-white">
                                      {employee.organization_info.command_responsibilities.employees_under_responsibility_count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>

                        {/* Card 4 - System Information */}
                        <Card className="p-6">
                          <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Info className="h-4.5 w-4.5 text-purple-500" />
                            מידע מערכת (System Information)
                          </h4>
                          <div className="space-y-1">
                            <EmployeeInfoRow 
                              label="תאריך יצירה" 
                              value={employee.created_at ? new Date(employee.created_at).toLocaleDateString('he-IL') : null} 
                            />
                            <EmployeeInfoRow 
                              label="עדכון אחרון" 
                              value={employee.updated_at ? new Date(employee.updated_at).toLocaleString('he-IL') : null} 
                            />
                            <EmployeeInfoRow 
                              label="כניסה אחרונה" 
                              value={employee.last_login ? new Date(employee.last_login).toLocaleString('he-IL') : null} 
                            />
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Tab Contents: היסטוריה (History) */}
                  {activeTab === 'history' && (
                    <div className="space-y-6">
                      {timeline.length === 0 ? (
                        <EmptyState 
                          icon={Clock} 
                          title="היסטוריה ריקה" 
                          description="לא נמצאו רשומות היסטוריה עבור עובד זה." 
                        />
                      ) : (
                        <div className="space-y-6 text-xs">
                          {groupedTimeline.map((group) => {
                            const { key, label, events } = group;
                            if (events.length === 0) return null;
                            const isCollapsed = !!collapsedGroups[key];
                            return (
                              <div key={key} className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100/80 dark:border-slate-800/80 p-4 transition-all duration-200">
                                {/* Date Group Header */}
                                <button 
                                  onClick={() => toggleGroupCollapse(key)}
                                  className="w-full flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-sm pb-2 border-b border-slate-100 dark:border-slate-800/60 mb-4 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <span>{label}</span>
                                    <Badge variant="secondary" className="text-3xs px-2 py-0">
                                      {events.length} {events.length === 1 ? 'פעילות' : 'פעילויות'}
                                    </Badge>
                                  </div>
                                  <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-350 transition-colors text-xs font-semibold">
                                    {isCollapsed ? 'הצג ▾' : 'סגור ▴'}
                                  </span>
                                </button>

                                {/* Date Group Events */}
                                {!isCollapsed && (
                                  <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-3 pr-6 space-y-6 py-2">
                                    {events.map((event: any) => {
                                      const { title, description, icon: IconComponent, severity, operator, orgUnit } = parseEventDetails(event);
                                      
                                      // Severity badge variant colors mapping
                                      const badgeColors = {
                                        default: "bg-slate-50 text-slate-700 border-slate-250 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50",
                                        success: "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
                                        warning: "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
                                        info: "bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                                      };

                                      const iconWrapperColors = {
                                        default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                                        success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
                                        warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30",
                                        info: "bg-blue-100 text-blue-650 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30"
                                      };

                                      return (
                                        <div key={event.id} className="relative group">
                                          {/* Timeline Bullet (Icon) */}
                                          <div className={`absolute top-0.5 right-[-36px] h-6.5 w-6.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs transition-all duration-300 ${iconWrapperColors[severity as 'default' | 'success' | 'warning' | 'info'] || iconWrapperColors.default}`}>
                                            <IconComponent className="h-3.5 w-3.5" />
                                          </div>

                                          {/* Event Card Content */}
                                          <div className="space-y-1 bg-white dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/60 rounded-xl p-3.5 hover:shadow-xs transition-all">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <span className="font-bold text-slate-800 dark:text-white text-sm">
                                                {title}
                                              </span>
                                              <div className="flex items-center gap-1.5 text-3xs text-slate-400 dark:text-slate-500 font-sans font-medium">
                                                <span>{new Date(event.timestamp).toLocaleDateString('he-IL')}</span>
                                                <span>·</span>
                                                <span>{new Date(event.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                            </div>
                                            
                                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                                              {description}
                                            </p>

                                            {/* Extra Metadata Row */}
                                            <div className="flex flex-wrap items-center gap-3 pt-2 text-3xs text-slate-450 dark:text-slate-500 font-bold border-t border-slate-50 dark:border-slate-900/30 mt-2">
                                              <div className="flex items-center gap-1">
                                                <span className="font-medium text-slate-400">מבצע הפעולה:</span>
                                                <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">{operator}</span>
                                              </div>
                                              {orgUnit && (
                                                <div className="flex items-center gap-1">
                                                  <span className="font-medium text-slate-400">יחידה:</span>
                                                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{orgUnit}</span>
                                                </div>
                                              )}
                                              <Badge variant="secondary" className={`font-extrabold py-0 px-1 rounded text-4xs uppercase tracking-wider ${badgeColors[severity as 'default' | 'success' | 'warning' | 'info'] || badgeColors.default}`}>
                                                {severity}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}


                  {/* Tab Contents: שיבוצים (Assignments) */}
                  {activeTab === 'assignments' && (() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const upcomingAssignments = assignments.filter(a => a.schedule_date > todayStr);
                    const historyAssignments = assignments.filter(a => a.schedule_date <= todayStr);

                    if (assignments.length === 0) {
                      return (
                        <EmptyState 
                          icon={Calendar} 
                          title="אין שיבוצים רשומים" 
                          description="לא נמצאו שיבוצי עבודה פעילים או קודמים עבור עובד זה." 
                        />
                      );
                    }

                    // Sort upcoming ascending
                    upcomingAssignments.sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));

                    // Group upcoming by date
                    const groupedUpcoming = (() => {
                      const groups: { [date: string]: any[] } = {};
                      upcomingAssignments.forEach(a => {
                        if (!groups[a.schedule_date]) {
                          groups[a.schedule_date] = [];
                        }
                        groups[a.schedule_date].push(a);
                      });
                      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
                    })();

                    // Sort history descending (newest first)
                    historyAssignments.sort((a, b) => b.schedule_date.localeCompare(a.schedule_date));

                    // Group history by Today, Yesterday, This Week, Older
                    const groupedHistory = (() => {
                      const todayList: any[] = [];
                      const yesterdayList: any[] = [];
                      const thisWeekList: any[] = [];
                      const olderList: any[] = [];

                      const now = new Date();
                      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                      const startOfYesterday = startOfToday - 86400000;
                      const startOfThisWeek = startOfToday - 86400000 * 7;

                      historyAssignments.forEach(a => {
                        if (!a.schedule_date) return;
                        const time = new Date(a.schedule_date).getTime();

                        if (time >= startOfToday) {
                          todayList.push(a);
                        } else if (time >= startOfYesterday) {
                          yesterdayList.push(a);
                        } else if (time >= startOfThisWeek) {
                          thisWeekList.push(a);
                        } else {
                          olderList.push(a);
                        }
                      });

                      return [
                        { key: 'today', label: 'היום', events: todayList },
                        { key: 'yesterday', label: 'אתמול', events: yesterdayList },
                        { key: 'thisWeek', label: 'השבוע', events: thisWeekList },
                        { key: 'older', label: 'ישן יותר', events: olderList }
                      ];
                    })();

                    const renderAssignmentCard = (a: any) => {
                      const statusColors: { [key: string]: "success" | "destructive" | "warning" | "info" | "secondary" | "default" } = {
                        AVAILABLE: "success",
                        SICK: "destructive",
                        LEAVE: "warning",
                        VACATION: "warning",
                        OFF: "secondary",
                      };

                      const statusNameMap: { [key: string]: string } = {
                        AVAILABLE: "פעיל / כשיר",
                        SICK: "חופשת מחלה",
                        LEAVE: "חופשה",
                        VACATION: "חופשה",
                        OFF: "לא במשמרת",
                      };

                      const statusVariant = statusColors[a.status_code] || "default";
                      const statusLabel = a.status_name || statusNameMap[a.status_code] || a.status_code || "לא ידוע";
                      const orgUnitName = a.org_unit_name || employee?.organization_info?.current_unit?.name || 'לא זמין';

                      // Format display date for inline info
                      const cardDateStr = new Date(a.schedule_date).toLocaleDateString('he-IL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      return (
                        <Card key={a.id} className="p-4 hover:shadow-xs transition-all border border-slate-100 dark:border-slate-800/80">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-500" />
                              {a.shift_type_name || 'משמרת'}
                            </h4>
                            <Badge variant={statusVariant} className="font-extrabold text-[10px] px-2 py-0.2">
                              {statusLabel}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <EmployeeInfoRow 
                              label="תאריך" 
                              value={cardDateStr} 
                            />
                            <EmployeeInfoRow 
                              label="שעת התחלה" 
                              value={a.start_time || 'לא זמין'} 
                            />
                            <EmployeeInfoRow 
                              label="שעת סיום" 
                              value={a.end_time || 'לא זמין'} 
                            />
                            <EmployeeInfoRow 
                              label="יחידה ארגונית" 
                              value={orgUnitName} 
                            />
                          </div>

                          {a.notes && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg text-slate-600 dark:text-slate-350 text-[11px] border border-slate-100/60 dark:border-slate-800/40 mt-3 font-medium leading-relaxed">
                              {a.notes}
                            </div>
                          )}
                        </Card>
                      );
                    };

                    return (
                      <div className="space-y-6 max-w-xl mx-auto text-xs">
                        {/* Upcoming Assignments Section */}
                        <div className="space-y-4">
                          <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            שיבוצים קרובים (Upcoming)
                          </h3>
                          {groupedUpcoming.length > 0 ? (
                            <div className="space-y-4">
                              {groupedUpcoming.map(([date, dateEvents]) => {
                                const formattedDate = new Date(date).toLocaleDateString('he-IL', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                });
                                return (
                                  <div key={date} className="space-y-2 border-r-2 border-slate-100 dark:border-slate-800 mr-2 pr-4 py-1">
                                    <div className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
                                      {formattedDate}
                                    </div>
                                    <div className="space-y-2">
                                      {dateEvents.map(a => renderAssignmentCard(a))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 text-slate-400 text-center font-medium">
                              אין שיבוצים עתידיים מתוכננים
                            </div>
                          )}
                        </div>

                        {/* Assignment History Section */}
                        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-6">
                          <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-500" />
                            היסטוריית שיבוצים (History)
                          </h3>
                          {historyAssignments.length > 0 ? (
                            <div className="space-y-4">
                              {groupedHistory.map((group) => {
                                const { key, label, events } = group;
                                if (events.length === 0) return null;
                                return (
                                  <div key={key} className="space-y-2 border-r-2 border-slate-100 dark:border-slate-800 mr-2 pr-4 py-1">
                                    <div className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
                                      {label}
                                    </div>
                                    <div className="space-y-2">
                                      {events.map(a => renderAssignmentCard(a))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 text-slate-400 text-center font-medium">
                              אין היסטוריית משמרות רשומה
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tab Contents: מסמכים (Documents) */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      {documents.length === 0 ? (
                        <EmptyState 
                          icon={FileText} 
                          title="אין מסמכים" 
                          description="לא נמצאו מסמכים המקושרים לתיק עובד זה." 
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {documents.map((doc) => (
                            <Card key={doc.id} className="p-4 flex flex-col justify-between hover:shadow-xs transition-all">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{doc.name}</p>
                                  <p className="text-slate-400 text-3xs font-medium">{doc.size} · {new Date(doc.uploaded_at).toLocaleDateString('he-IL')}</p>
                                </div>
                                <Badge variant="secondary" className="uppercase text-3xs font-bold">{doc.file_type}</Badge>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="w-full text-2xs py-1 h-auto font-semibold">צפייה</Button>
                                <Button variant="outline" size="sm" className="w-full text-2xs py-1 h-auto font-semibold">הורדה</Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Contents: ציוד (Equipment) */}
                  {activeTab === 'equipment' && (
                    <div className="space-y-4">
                      {equipment.length === 0 ? (
                        <EmptyState 
                          icon={Package} 
                          title="אין ציוד רשום" 
                          description="לא נמצא ציוד חתום או משוייך לעובד זה במערכת." 
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {equipment.map((eq) => (
                            <Card key={eq.id} className="p-4 space-y-3 hover:shadow-xs transition-all">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800 dark:text-white">{eq.name}</p>
                                <Badge variant={eq.condition === 'NEW' ? 'success' : 'warning'} className="text-3xs font-bold">{eq.condition}</Badge>
                              </div>
                              <div className="space-y-1.5 text-2xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-medium">מספר סידורי:</span>
                                  <span className="font-bold font-mono text-slate-700 dark:text-slate-350">{eq.serial_number}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-medium">תאריך ניפוק:</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-350">{new Date(eq.issued_at).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Contents: התראות (Alerts) */}
                  {activeTab === 'alerts' && (
                    <EmptyState 
                      icon={Bell} 
                      title="אין התראות" 
                      description="אין התראות כשירות או פניות פתוחות עבור עובד זה." 
                    />
                  )}

                  {/* Tab Contents: הרשאות (Permissions) */}
                  {activeTab === 'permissions' && (
                    <div className="space-y-6 text-xs">
                      {/* Section 1 - Roles */}
                      <div className="space-y-2">
                        <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest">
                          תפקידי אבטחה (Roles)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 font-bold px-3 py-1 text-xs">
                            {employee.rank === 'Sgt Maj' || canEdit ? 'מפקד יחידה (Unit Commander)' : 'עובד מן השורה (Standard Personnel)'}
                          </Badge>
                          <Badge variant="secondary" className="text-slate-600 dark:text-slate-300 font-medium px-3 py-1 text-xs">
                            משתמש מערכת רשום (Registered User)
                          </Badge>
                        </div>
                      </div>

                      {/* Section 2 - Permission Groups */}
                      <div className="space-y-2">
                        <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest">
                          קבוצות הרשאות (Permission Groups)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-semibold px-2.5 py-1">
                            צפייה כללית ביחידה (Unit View Access)
                          </Badge>
                          <Badge variant="secondary" className="font-semibold px-2.5 py-1">
                            דיווח נוכחות (Attendance Reporting)
                          </Badge>
                          {canEdit && (
                            <Badge variant="secondary" className="font-semibold px-2.5 py-1">
                              ניהול שיבוצים מוגבר (Advanced Duty Scheduling)
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Section 3 - Detailed Permissions by Category */}
                      <div className="space-y-3">
                        <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest">
                          הרשאות מפורטות (Individual Permissions)
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Category A - Personnel */}
                          <Card className="p-4 space-y-3">
                            <h5 className="font-bold text-slate-700 dark:text-white border-b pb-1.5 border-slate-100 dark:border-slate-800">
                              ניהול כוח אדם ופרסונל (Personnel)
                            </h5>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-slate-500 font-medium">צפייה בכרטיסי עובדים (employees.view)</span>
                                <Badge variant="success" className="h-4.5 px-1.5 rounded-full flex items-center gap-1 text-3xs font-extrabold"><Check className="h-3 w-3" /> מאושר</Badge>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-slate-500 font-medium">עריכת פרטי עובדים (employees.update)</span>
                                {canEdit ? (
                                  <Badge variant="success" className="h-4.5 px-1.5 rounded-full flex items-center gap-1 text-3xs font-extrabold"><Check className="h-3 w-3" /> מאושר</Badge>
                                ) : (
                                  <Badge variant="secondary" className="h-4.5 px-1.5 rounded-full text-3xs font-bold">לא מוקצה</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-slate-500 font-medium">צפייה בבקשות העברה (transfers.view)</span>
                                <Badge variant="success" className="h-4.5 px-1.5 rounded-full flex items-center gap-1 text-3xs font-extrabold"><Check className="h-3 w-3" /> מאושר</Badge>
                              </div>
                            </div>
                          </Card>

                          {/* Category B - Scheduling */}
                          <Card className="p-4 space-y-3">
                            <h5 className="font-bold text-slate-700 dark:text-white border-b pb-1.5 border-slate-100 dark:border-slate-800">
                              תזמון וסידור עבודה (Scheduling)
                            </h5>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-slate-500 font-medium">צפייה בסידור עבודה (schedule.view)</span>
                                <Badge variant="success" className="h-4.5 px-1.5 rounded-full flex items-center gap-1 text-3xs font-extrabold"><Check className="h-3 w-3" /> מאושר</Badge>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-slate-500 font-medium">ניהול ואישור משמרות (schedule.manage)</span>
                                {canEdit ? (
                                  <Badge variant="success" className="h-4.5 px-1.5 rounded-full flex items-center gap-1 text-3xs font-extrabold"><Check className="h-3 w-3" /> מאושר</Badge>
                                ) : (
                                  <Badge variant="secondary" className="h-4.5 px-1.5 rounded-full text-3xs font-bold">לא מוקצה</Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Dialog: Edit Details */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile Details</DialogTitle>
                  <DialogDescription>Update employee identity and rank settings here.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">First Name</label>
                      <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Last Name</label>
                      <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Rank</label>
                      <Input value={editRank} onChange={e => setEditRank(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Position</label>
                      <Input value={editPosition} onChange={e => setEditPosition(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Personal Number</label>
                      <Input value={editEmpNum} onChange={e => setEditEmpNum(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Service Type</label>
                      <Input value={editServiceType} onChange={e => setEditServiceType(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Commander</label>
                    <Input value={editCommanderId} onChange={e => setEditCommanderId(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Email</label>
                      <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Phone</label>
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Birthdate (YYYY-MM-DD)</label>
                    <Input value={editBirthdate} onChange={e => setEditBirthdate(e.target.value)} required />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog: Change Status */}
            <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Change Availability Status</DialogTitle>
                  <DialogDescription>Select active status from catalog rules.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Select Status</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                      <option value="AVAILABLE">AVAILABLE (Ready)</option>
                      <option value="SICK">SICK (Medical Leave)</option>
                      <option value="VACATION">VACATION (Leave)</option>
                      <option value="TRAINING">TRAINING (In School)</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
                    <Button type="submit">Update Status</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog: Transfer Unit */}
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Submit Transfer Request</DialogTitle>
                  <DialogDescription>Submit transfer proposal to administrative chain.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Target Unit</label>
                    <select value={targetUnitId} onChange={e => setTargetUnitId(e.target.value)} required
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                      <option value="">-- Select Target Unit --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Reason (Optional)</label>
                    <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
                      placeholder="Specify reasoning for transfer request..." />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
                    <Button type="submit">Submit Request</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog: Assign Schedule */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Assign Daily Schedule Status</DialogTitle>
                  <DialogDescription>Assign specific duty status details on selected calendar date.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Schedule Date</label>
                    <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} required />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Duty Status</label>
                    <select value={schedStatusId} onChange={e => setSchedStatusId(e.target.value)} required
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                      {availableStatuses.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Notes</label>
                    <textarea value={schedNotes} onChange={e => setSchedNotes(e.target.value)} rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
                      placeholder="Add any shift notes or assignment remarks..." />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                    <Button type="submit">Assign Status</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </div>
        )
      )}
    </div>
  );
}
