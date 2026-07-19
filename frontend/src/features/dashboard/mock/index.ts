import {
  DashboardSummaryDTO,
  AlertDTO,
  PendingApprovalsDTO,
  ShiftCoverageDTO,
  OrganizationTreeDTO,
  ActivityDTO,
  NotificationDTO,
  QuickActionDTO,
} from "../types";

export const mockDashboardSummary: DashboardSummaryDTO = {
  workspaceId: "unit-a",
  readinessScore: 92,
  workforce: {
    totalPersonnel: 120,
    presentCount: 98,
    absentCount: 2,
    sickCount: 8,
    vacationCount: 7,
    courseCount: 5,
    reinforcementCount: 3,
  },
  attendance: {
    reportingDate: "2026-07-19",
    expectedReports: 120,
    submittedReports: 114,
    percentComplete: 95,
    missingSubunits: ["מחלקה ג' - פלוגה רובאית"],
  },
  alertsCount: 2,
};

export const mockAlerts: AlertDTO[] = [
  {
    id: "alert-1",
    severity: "CRITICAL",
    title: "חסר מפקד תורן",
    description: "לא נמצא מפקד רשום למשמרת בוקר בשער צפון.",
    createdAt: "2026-07-19T07:00:00Z",
    subunitId: "sec-north",
    actionPath: "/scheduling",
  },
  {
    id: "alert-2",
    severity: "WARNING",
    title: "חריגת רף חולים פלוגת מפקדה",
    description: "מספר החולים בפלוגת מפקדה עומד על 8 עובדים (מעל רף של 5%).",
    createdAt: "2026-07-19T06:30:00Z",
    subunitId: "hq-company",
  },
];

export const mockPendingApprovals: PendingApprovalsDTO = {
  count: 3,
  requests: [
    {
      requestId: "req-101",
      employeeName: "רס\"ן דוד לוי",
      type: "בקשת חופשה",
      details: "חופשה שנתית: 2026-07-20 עד 2026-07-24 (5 ימים)",
      createdAt: "2026-07-19T08:00:00Z",
    },
    {
      requestId: "req-102",
      employeeName: "סרן נועה כהן",
      type: "בקשת מעבר",
      details: "מעבר מחלקה: פלוגה רובאית -> פלוגת מפקדה",
      createdAt: "2026-07-19T07:45:00Z",
    },
  ],
};

export const mockShiftCoverage: ShiftCoverageDTO = {
  date: "2026-07-19",
  totalShifts: 12,
  filledShifts: 10,
  gapsCount: 2,
  gapsList: [
    { shiftId: "s-1", role: "שומר שער דרום", timeSlot: "14:00 - 22:00" },
    { shiftId: "s-2", role: "חובש תורן", timeSlot: "22:00 - 06:00" },
  ],
};

export const mockOrganizationTree: OrganizationTreeDTO = {
  workspaceId: "unit-a",
  rootNode: {
    id: "root",
    name: "גדוד 51",
    status: "OPTIMAL",
    readinessScore: 92,
    children: [
      {
        id: "comp-a",
        name: "פלוגה א' - רובאית",
        status: "OPTIMAL",
        readinessScore: 94,
        children: [
          { id: "sub-1", name: "מחלקה 1", status: "OPTIMAL", readinessScore: 96 },
          { id: "sub-2", name: "מחלקה 2", status: "OPTIMAL", readinessScore: 95 },
          { id: "sub-3", name: "מחלקה 3", status: "WARNING", readinessScore: 82 },
        ],
      },
      {
        id: "comp-b",
        name: "פלוגה ב' - מסייעת",
        status: "OPTIMAL",
        readinessScore: 91,
        children: [
          { id: "sub-4", name: "מחלקה 4", status: "OPTIMAL", readinessScore: 92 },
          { id: "sub-5", name: "מחלקת מרגמות", status: "OPTIMAL", readinessScore: 90 },
        ],
      },
      {
        id: "comp-c",
        name: "פלוגת מפקדה",
        status: "CRITICAL",
        readinessScore: 78,
        children: [
          { id: "sub-6", name: "מחלקת רפואה", status: "OPTIMAL", readinessScore: 95 },
          { id: "sub-7", name: "מחלקת לוגיסטיקה", status: "CRITICAL", readinessScore: 71 },
        ],
      },
    ],
  },
};

export const mockActivities: ActivityDTO[] = [
  {
    id: "act-1",
    actorName: "סא\"ל אהרון ישראלי",
    actionDescription: "אישר בקשת חופשה עבור רס\"ן דוד לוי",
    timestamp: "2026-07-19T08:15:00Z",
    category: "SYSTEM",
  },
  {
    id: "act-2",
    actorName: "רס\"ר יוסי מזרחי",
    actionDescription: "עדכן דיווח נוכחות פלוגת מפקדה (100% הגשה)",
    timestamp: "2026-07-19T08:05:00Z",
    category: "WORKFORCE",
  },
  {
    id: "act-3",
    actorName: "סרן נועה כהן",
    actionDescription: "הגדירה סידור עבודה חדש למשמרות השער",
    timestamp: "2026-07-19T07:30:00Z",
    category: "SCHEDULING",
  },
];

export const mockNotifications: NotificationDTO[] = [
  {
    id: "not-1",
    title: "עדכון גרסה 1.4",
    body: "נוספו סלוטים דינמיים למעטפת הארגונית החדשה.",
    isRead: false,
    createdAt: "2026-07-19T06:00:00Z",
  },
  {
    id: "not-2",
    title: "תזכורת: הגשת סידורי עבודה לשבוע הבא",
    body: "נא לוודא הגשה מכל פלוגות הגדוד עד מחר בשעה 12:00.",
    isRead: true,
    createdAt: "2026-07-18T10:00:00Z",
  },
];

export const mockQuickActions: QuickActionDTO[] = [
  {
    id: "add-employee",
    label: "הוסף עובד / חייל",
    actionType: "DIALOG",
    target: "add-employee-dialog",
    requiredPermission: "COMMANDER",
    iconName: "UserPlus",
  },
  {
    id: "report-attendance",
    label: "דווח נוכחות",
    actionType: "NAVIGATE",
    target: "/workforce/scheduling/statuses",
    iconName: "ClipboardCheck",
  },
  {
    id: "create-schedule",
    label: "סידור עבודה",
    actionType: "NAVIGATE",
    target: "/workforce/scheduling",
    requiredPermission: "MANAGER",
    iconName: "CalendarDays",
  },
  {
    id: "generate-report",
    label: "הפק דוחות יחידה",
    actionType: "NAVIGATE",
    target: "/reports",
    iconName: "FileSpreadsheet",
  },
];
