import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  History, 
  ExternalLink,
  Square,
  Minus,
  CalendarDays,
  RotateCcw,
  Trash2,
  HelpCircle,
  MessageSquare,
  Users,
  Bug
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TourGuideOverlay } from "./TourGuideOverlay";
import type { TourStep } from "./TourGuideOverlay";
import { useChat } from "@/context/ChatContext";
import { useAuthContext } from "@/context/AuthContext";
import { Cog } from "lucide-react";

const TOUR_STEPS: TourStep[] = [
  // --- CHAT & STATUS (first in tour) ---
  { id: 'system_status', selector: '#system-status-dot, #mobile-system-status-dot', path: '/', title: 'סטטוס פעילות המערכת', content: 'כאן מופיע חיווי ירוק קבוע המציין שהחיבור לשרת פעיל ומאובטח. לחיצה עליו תציג פרטים על זמן הכניסה האחרון שלך.' },
  { id: 'chat_status_step', selector: '#chat-toggle-btn', path: '/', title: 'צ׳אט ישיר בין מפקדים', content: 'בסרגל העליון, ליד הפעמון, ישנו אייקון הודעות (בועת שיחה 💬) — לחיצה עליו פותחת את הצ׳אט הצידי לתקשורת ישירה עם שאר המפקדים ביחידה. שם תוכלו לנהל שיחות פרטיות, לראות מי מחובר כעת (נקודה ירוקה/אדומה), ולעדכן את הסטטוס האישי שלכם (זמין/לא זמין). כפתור זה מופיע רק במחשב.' },
  { id: 'group_message_step', selector: '#group-message-btn', path: '/', title: 'שליחת הודעה קבוצתית', content: 'בלחיצה על כפתור הקבוצה (👥), ייפתח חלון לשליחת הודעה מרוכזת. תוכלו לבחור מחלקות, מדורים או חוליות שלמות ולשלוח להם הודעה אחת שתגיע לכל החברים ביחידה שבחרתם ללא צורך לשלוח לכל אחד בנפרד.' },
  { id: 'notifications_bell', selector: '#mobile-notifications-btn', path: '/', title: 'פעמון ההתראות', content: 'בסרגל העליון תמצאו את אייקון הפעמון (🔔). לחיצה עליו פותחת חלון עם 3 לשוניות: פעילות — התראות מהמערכת (שוטרים שלא דיווחו, בקשות ממתינות וכו׳), הודעות — מעבר לצ׳אט הפנימי עם המפקדים, והיסטוריה — התראות שכבר קראתם. מספר אדום/כתום על הפעמון מציין כמה התראות ממתינות לטיפולכם.' },

  // --- DASHBOARD PAGE ---
  { id: 'dashboard_filter', selector: '#dashboard-filter-btn, #mobile-filter-trigger', path: '/', title: 'סינון נתונים', content: 'כפתור הסינון מאפשר לכם לסנן את כל הנתונים בלוח הבקרה לפי יחידה ארגונית (מחלקה/מדור/חוליה), סטטוס, מעמד שירות וטווח גילאים. כך תוכלו לראות נתונים ממוקדים של הצוות שלכם בלבד. ניתן לשלב כמה מסננים יחד, ולנקות הכל בלחיצה אחת.' },
  { id: 'report_hub', selector: '#report-hub-card, #report-hub-card-mobile', path: '/', title: 'מרכז הפקת דוחות', content: 'החלק האהוב על המפקדים. מכאן מוציאים את כל דוחות ה-PDF והתמונות לווטסאפ של היחידה בלחיצת כפור.' },
  { id: 'dashboard_event', selector: '#event-button, #mobile-event-button', path: '/', title: 'אירוע יחידתי', content: 'יצירת אירועים מיוחדים, תדריכים או פעילויות יחידתיות שיקפצו לכולם בלוח השנה ובהתראות.' },
  { id: 'dashboard_broadcast', selector: '#broadcast-button, #mobile-broadcast-button', path: '/', title: 'רשימת תפוצה', content: 'מכאן ניתן לשלוח הודעות מרוכזות לכל היחידה, לצוות מסוים או רק לאלה שלא דיווחו נוכחות.' },
  { id: 'attendance_trend', selector: '#attendance-chart', path: '/', title: 'מגמת זמינות', content: 'גרף המציג את מגמת נוכחות וזמינות השוטרים לאורך זמן (שבועי, חודשי או שנתי). עוזר לזהות מגמות ודפוסי התנהגות ביחידה.' },
  { id: 'status_distribution', selector: '#attendance-snapshot-card', path: '/', title: 'חלוקת סטטוסים', content: "תרשים עוגה/דונאט שמראה את התפלגות השוטרים לפי הסטטוסים השונים (משרד, חופשה, מחלה וכו') עבור היום שנבחר." },
  { id: 'age_distribution', selector: '#age-distribution-card', path: '/', title: 'חתך גילאים', content: 'גרף עמודות המציג את התפלגות הגילאים של שוטרי היחידה, כולל הצגת הגיל הממוצע של כלל המשרתים.' },
  { id: 'birthdays', selector: '#birthdays-card', path: '/', title: 'ימי הולדת השבוע', content: 'מרכז החגיגות! כאן תוכלו לראות מי חוגג, לשלוח לו ברכה אישית בוואטסאפ או לראות את הפרופיל שלו.' },
  { id: 'stats_comparison', selector: '#stats-comparison-card', path: '/', title: 'השוואת כוח אדם', content: 'כלי להשוואת אחוזי נוכחות וזמינות בין המחלקות, המדורים או החוליות השונות. ניתן ללחוץ על יחידה כדי לבצע סינון ולקדוח (Drill-Down) פנימה.' },

  // --- ATTENDANCE PAGE ---
  { id: 'attendance_calendar', selector: '#attendance-calendar-btn, #mobile-attendance-calendar-btn', path: '/attendance', title: 'תצוגת לוח שנה', content: 'לחץ כאן כדי לעבור מתצוגת רשימה לתצוגת לוח שנה חודשית, המאפשרת ראייה רחבה של הנוכחות לאורך זמן.' },
  { id: 'attendance_export', selector: '#attendance-export-btn, #mobile-attendance-export-btn', path: '/attendance', title: 'ייצוא נתוני נוכחות', content: 'מכאן תוכל לייצא את דוח הנוכחות היומי לקובץ Excel או PDF, וגם לשתף ישירות לוואטסאפ.' },
  { id: 'self_report', selector: '#self-report-button, #mobile-self-report-btn', path: '/attendance', title: 'דיווח נוכחות עצמי', content: 'בלחיצה אחת תוכל לעדכן את הנוכחות שלך להיום מבלי לחפש את עצמך ברשימה.' },
  { id: 'bulk_update', selector: '#bulk-update-btn, #mobile-bulk-update-btn', path: '/attendance', title: 'עדכון מרוכז', content: 'כלי מהיר לעדכון סטטוס נוכחות למספר שוטרים בבת אחת. סמן את השוטרים הרלוונטיים ולחץ כאן לעדכון גורף.' },
  { id: 'attendance_header', selector: '#attendance-header', path: '/attendance', title: 'ניהול נוכחות יומי', content: 'כאן מתבצעת העבודה האמיתית. תוכלו לסנן לפי מדור או צוות ולראות בדיוק מי נמצא איפה.' },

  // --- ROSTER / SHIFTS PAGE ---
  { id: 'roster_grid', selector: '#roster-page-container', path: '/roster', title: 'סידור עבודה ומשמרות', content: 'זה הלב של תכנון היחידה. כאן בונים את סידור העבודה לשבוע הקרוב, משבצים משמרות וקובעים תגבורים.' },
  { id: 'roster_status_change', selector: '#tour-roster-cell, #mobile-tour-roster-cell, #tour-roster-dialog', path: '/roster', title: 'שיבוץ עובד בסידור', content: 'במחשב: העבירו את העכבר מעל התא ולחצו על כפתור הפלוס הכחול (+). בנייד: לחצו ישירות על שורת העובד. ייפתח חלון עם כרטיסי סטטוס לבחירה (משרד, חופשה, מחלה ועוד).' },
  { id: 'roster_weekend_holidays', selector: '#tour-roster-weekend-cell, #mobile-tour-roster-weekend-cell, #tour-roster-dialog', path: '/roster', title: 'שיבוץ בסופי שבוע וחגים', content: 'בימי שישי, שבת וחגים לא ניתן לבצע שיבוץ עבודה רגיל. המערכת תציג לכם אוטומטית רק אפשרויות לשיבוץ "תגבור" או סטטוס "אחר" עם שדה טקסט חופשי.' },

  // --- EMPLOYEES PAGE ---
  { id: 'employees_search', selector: '#employees-search-container', path: '/employees', title: 'חיפוש שוטרים', content: 'מחפשים מישהו ספציפי? פשוט תתחילו להקליד שם או מספר אישי.' },
  { id: 'add_employee_btn', selector: '#add-employee-button, #import-employees-button', path: '/employees', title: 'קליטת עובדים חדשים', content: 'הצטרף מישהו חדש ליחידה? דרך כפתור "הוספה" מקימים אותו במערכת תוך שניות. ואם יש לכם כמות גדולה של עובדים להזין בבת אחת, תוכלו ללחוץ על "ייבוא מקובץ" ולהעלות קובץ אקסל (Excel/CSV) כדי להכניס את כל הנתונים במהירות מבלי להוסיף אחד-אחד.' },

  // --- SETTINGS PAGES ---
  { id: 'personal_profile', selector: '#sidebar-profile-container, #sidebar-profile-link-collapsed', path: '/', title: 'עריכת פרופיל אישי', content: 'בכל שלב במערכת, לחיצה על תמונת הפרופיל או השם שלכם בתחתית סרגל הניווט תוביל אתכם ישירות לעדכון הפרטים האישיים, הגדרת PIN, ורישום זיהוי ביומטרי.' },
  { id: 'appearance_palette', selector: '#appearance-settings-page', path: '/settings?tab=appearance', title: 'נראות ועיצוב המערכת', content: 'מכאן תוכלו להתאים את המערכת בדיוק להעדפות שלכם: לבחור מראה יום/לילה, לשנות את גודל הגופן לתצוגה נוחה, ולבחור את צבע התצוגה המרכזי של המערכת.' },
  { id: 'settings_security', selector: '#security-tab, #mobile-security-tab', path: '/settings?tab=security', title: 'אבטחה וסיסמה', content: 'צריכים להחליף סיסמה? זה המקום. מומלץ להחליף סיסמה פעם בכמה חודשים לשמירה על אבטחת החשבון.' }
];

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  action?: { label: string; stepId: string; };
  suggestions?: { label: string; stepId: string; }[];
}

// Higher Intelligence Knowledge Base with Weighting Logic
const KNOWLEDGE_BASE = [
  { 
    id: 'roster', 
    title: 'סידור עבודה ומשמרות', 
    keywords: ['משמרת', 'משמרות', 'סידור', 'לו"ז', 'לוז', 'תכנון', 'שבוע הבא', 'שיבוץ', 'סידור עבודה', 'רוסטר', 'שבתות', 'לילות', 'בקרים', 'תורנות', 'שיבוצים'], 
    context: ['עבודה', 'מתי', 'איפה', 'איך', 'לוח', 'זמנים'], 
    description: 'את סידור העבודה והמשמרות לשבוע הקרוב מנהלים בדף ה"רוסטר". שם תוכל לשבץ עובדים לכל יום בשבוע.', 
    stepId: 'roster_grid' 
  },
  { 
    id: 'add_employee', 
    title: 'הוספת עובד חדש', 
    keywords: ['להוסיף', 'חדש', 'קליטה', 'להקים', 'רישום', 'הוספה', 'נוסיף', 'לשים', 'עוד', 'מינוי', 'גיוס', 'מצטרף'], 
    context: ['עובד', 'שוטר', 'עובדים', 'מישהו', 'אדם', 'איש'], 
    description: 'כדי להוסיף עובד חדש ליחידה, עליך לעבור לדף ניהול עובדים וללחוץ על כפתור הוספה (סימן הפלוס).', 
    stepId: 'add_employee_btn' 
  },
  {
    id: 'personal_profile_kb',
    title: 'עדכון פרופיל אישי ופרטים',
    keywords: ['פרטים', 'פרופיל', 'אישי', 'לעדכן פרטים', 'לשנות סיסמא', 'פין', 'PIN', 'עדכון פרופיל', 'הגדרות שלי', 'עריכת פרופיל'],
    context: ['פרופיל', 'משתמש', 'אישי', 'הגדרות'],
    description: 'כדי לעדכן את הפרטים האישיים שלך, להגדיר קוד PIN או לשנות סיסמה, לחץ על שמך או תמונת הפרופיל שלך בתחתית תפריט הצד.',
    stepId: 'personal_profile'
  },
  { 
    id: 'attendance', 
    title: 'דיווח נוכחות', 
    keywords: ['נוכחות', 'לדווח', 'סטטוס', 'יומן', 'איפה', 'זמינות', 'חופש', 'מחלה', 'משרד', 'דיווח', 'איפה כולם', 'נמצאים', 'נוכחים', 'חסרים', 'לא הגיעו', 'נפקדים'], 
    context: ['שוטר', 'עובד', 'מצב', 'רשימה'], 
    description: 'ניהול הנוכחות היומי מתבצע בדף היומן. שם מעדכנים מי נמצא ביחידה ברגע זה.', 
    stepId: 'attendance_header' 
  },
  { 
    id: 'reports', 
    title: 'הפקת דוחות', 
    keywords: ['דוח', 'דוחות', 'PDF', 'להפיק', 'לשלוח', 'תמונה', 'וואטסאפ', 'ייצוא', 'סטטיסטיקה', 'סיכום', 'נתונים', 'גרפים', 'קובץ'], 
    context: ['נתונים', 'להוציא', 'הדפסה', 'פרסום'], 
    description: 'את כל הדוחות היחידתיים ניתן להפיק מתוך "מרכז הדוחות" בלוח הבקרה הראשי. במסך הנוכחות ניתן גם לייצא נתונים בעזרת כפתור הייצוא.', 
    stepId: 'report_hub' 
  },
  { 
    id: 'excel_export', 
    title: 'ייצוא דוח אקסל (Excel)', 
    keywords: ['אקסל', 'excel', 'EXCEL', 'ייצוא אקסל', 'קובץ אקסל', 'דוח אקסל', 'להוריד אקסל', 'ייצוא נתונים', 'ייצוא נוכחות', 'לפי תאריך', 'ייצוא לפי תאריך', 'אקסלים', 'קובצי אקסל'], 
    context: ['דוח', 'דוחות', 'נוכחות', 'קובץ', 'ייצוא'], 
    description: 'כדי לייצא דוח נוכחות מפורט בפורמט Excel או PDF לפי טווח תאריכים מוגדר, לחץ על "ייצוא" הממוקם בסרגל הכלים העליון במסך הנוכחות.', 
    stepId: 'attendance_export' 
  },
  { 
    id: 'attendance_trend_kb', 
    title: 'גרף מגמת זמינות', 
    keywords: ['מגמה', 'מגמת זמינות', 'גרף מגמה', 'גרף נוכחות לאורך זמן', 'מגמות', 'שינוי זמינות'], 
    context: ['גרפים', 'נתונים', 'סטטיסטיקה'], 
    description: 'גרף מגמת זמינות מראה את אחוז הנוכחות והזמינות של היחידה לאורך זמן לפי טווח הימים שבחרת.', 
    stepId: 'attendance_trend' 
  },
  { 
    id: 'status_distribution_kb', 
    title: 'גרף חלוקת סטטוסים', 
    keywords: ['חלוקת סטטוסים', 'עוגה', 'דונאט', 'גרף עוגה', 'התפלגות סטטוסים', 'סטטוסים היום'], 
    context: ['גרפים', 'נתונים', 'סטטיסטיקה'], 
    description: 'גרף חלוקת סטטוסים מציג את התפלגות השוטרים ביחידה לפי הסטטוסים השונים (משרד, חופשה, מחלה וכו\') להיום.', 
    stepId: 'status_distribution' 
  },
  { 
    id: 'age_distribution_kb', 
    title: 'גרף חתך גילאים', 
    keywords: ['חתך גילאים', 'גילאים', 'גרף גילאים', 'התפלגות גילאים', 'גיל ממוצע'], 
    context: ['גרפים', 'נתונים', 'סטטיסטיקה'], 
    description: 'גרף חתך גילאים מציג את התפלגות המשרתים ביחידה לפי קבוצות גיל שונות, ומציג את הגיל הממוצע.', 
    stepId: 'age_distribution' 
  },
  { 
    id: 'stats_comparison_kb', 
    title: 'גרף השוואת כוח אדם', 
    keywords: ['השוואה', 'השוואת כוח אדם', 'השוואת כח אדם', 'קדיחה', 'drill-down', 'מעבר בין רמות', 'מחלקה למדור', 'חוליה'], 
    context: ['גרפים', 'נתונים', 'סטטיסטיקה'], 
    description: 'גרף השוואת כוח אדם מאפשר להשוות את אחוזי הנוכחות והזמינות של יחידות משנה. לחיצה על יחידה תרד רמה (מחלקה -> מדור -> חוליה -> שוטר).', 
    stepId: 'stats_comparison' 
  },
  { 
    id: 'bulk_update_kb', 
    title: 'עדכון נוכחות מרוכז', 
    keywords: ['מרוכז', 'גורף', 'כולם', 'עדכון מרוכז', 'לסמן', 'ביחד', 'כמה שוטרים', 'לדווח למספר אנשים'], 
    context: ['נוכחות', 'דיווח', 'יומן'], 
    description: 'לעדכון מרוכז, עבור למסך הנוכחות ולחץ על כפתור "עדכון מרוכז" בסרגל העליון (או בחר מספר שוטרים מהרשימה).', 
    stepId: 'bulk_update' 
  },
  { 
    id: 'self_report_kb', 
    title: 'דיווח נוכחות אישי', 
    keywords: ['עצמי', 'אישי', 'לדווח על עצמי', 'שלי', 'הנוכחות שלי', 'איך אני מדווח'], 
    context: ['דיווח', 'יומן'], 
    description: 'כדי לדווח נוכחות על עצמך במהירות, לחץ על "דיווח עצמי" בסרגל העליון של דף הנוכחות.', 
    stepId: 'self_report' 
  },
  { 
    id: 'attendance_calendar_kb', 
    title: 'תצוגת לוח שנה', 
    keywords: ['לוח שנה', 'חודש', 'יומן חודשי', 'תצוגה חודשית', 'פריסה חודשית'], 
    context: ['תצוגה', 'נוכחות', 'זמן'], 
    description: 'באפשרותך לראות את נתוני הנוכחות בפריסה חודשית מלאה על ידי מעבר ל"לוח שנה" במסך הנוכחות.', 
    stepId: 'attendance_calendar' 
  },
  { 
    id: 'broadcast_kb', 
    title: 'רשימת תפוצה (הודעות)', 
    keywords: ['תפוצה', 'הודעה לכולם', 'לשלוח לכולם', 'וואטסאפ מרוכז', 'הודעה קבוצתית', 'תפוצות'], 
    context: ['וואטסאפ', 'הודעות', 'שליחה'], 
    description: 'ניתן לשלוח הודעות מרוכזות לקבוצות או לכל היחידה בעזרת כפתור "רשימת תפוצה" בלוח הבקרה.', 
    stepId: 'dashboard_broadcast' 
  },
  { 
    id: 'event_kb', 
    title: 'ניהול אירועים מיוחדים', 
    keywords: ['אירוע', 'תדריך', 'כנס', 'פעילות', 'מיוחד', 'מבצע', 'לוז יחידתי'], 
    context: ['לוח שנה', 'פעילות'], 
    description: 'ניתן ליצור אירועים יחידתיים ותדריכים בעזרת כפתור "אירוע" הממוקם בלוח הבקרה תחת מרכז הדוחות.', 
    stepId: 'dashboard_event' 
  },
  {
    id: 'appearance', 
    title: 'עיצוב וצבעים', 
    keywords: ['צבע', 'מראה', 'עיצוב', 'Theme', 'אקצנט', 'צבעים', 'לילה', 'יפה', 'גופן', 'פונט', 'אישי', 'התאמה', 'כהה', 'בהיר'], 
    context: ['מערכת', 'שינוי', 'נראות'], 
    description: 'ניתן לשנות את צבעי המערכת ואת ערכת הנושא דרך דף ההגדרות בלשונית "מראה ותצוגה".', 
    stepId: 'appearance_palette' 
  },
  { 
    id: 'filters_modern', 
    title: 'סינון נתונים מתקדם', 
    keywords: [
      'לסנן', 'סינון', 'פילטר', 'חיפוש מתקדם', 'לפי גיל', 'גילאים', 'טווח גיל', 
      'מעמד', 'קבע', 'שחם', 'מתנדב', 'סטטוסים', 'מחלקה', 'מדור', 'צוות', 
      'נקה הכל', 'החל סינון', 'איך מסננים', 'איפה הפילטר', 'חיפוש שוטרים', 
      'רשימה לפי', 'קבוצה', 'סיווג', 'שירות', 'סדיר', 'מילואים', 'אזרחים', 'פנסיונרים'
    ], 
    context: ['מערכת', 'נתונים', 'חיפוש', 'מיון'], 
    description: 'מערכת הסינון החדשה מאפשרת לך לדייק את הנתונים המוצגים לפי מגוון קטגוריות. ניתן לסנן לפי יחידה ארגונית, סטטוס דיווח, מעמד השירות וטווח גילאים. חשוב לזכור ללחוץ על כפתור "החל סינון" בסיום הבחירה.', 
    stepId: 'dashboard_filters' 
  },
  { 
    id: 'age_slider', 
    title: 'סינון לפי גיל', 
    keywords: [
      'גיל', 'גילאים', 'בן כמה', 'צעירים', 'מבוגרים', 'טווח', 'סליידר', 'גלילה', 
      'שנים', 'נולדו', 'תאריך לידה', 'ילידי', 'בוגרים', 'נוער', 'מתחת לגיל', 'מעל לגיל'
    ], 
    context: ['חיפוש', 'סינון', 'מידע'], 
    description: 'הוספנו סליידר גילאים חדש בלשונית "גילאים" שבתוך מסך הסינון. ניתן לגרור את שני הקצוות כדי לקבוע טווח גילאים מדויק (למשל: 18 עד 25) ולראות רק את השוטרים המתאימים.', 
    stepId: 'dashboard_filters' 
  },
  { 
    id: 'apply_logic', 
    title: 'החלת הסינון', 
    keywords: ['לא מתעדכן', 'לא עובד', 'לא משתנה', 'איך מאשרים', 'אישור', 'החלה', 'עדכון', 'למה זה לא זז', 'לחצתי וכלום לא קרה'], 
    context: ['סינון', 'באג', 'שאלה'], 
    description: 'במערכת החדשה, הנתונים מתעדכנים רק לאחר לחיצה על כפתור "החל סינון" בתחתית מסך הסינון. זה מאפשר לך לבחור כמה קטגוריות יחד בצורה מרוכזת ומהירה.', 
    stepId: 'dashboard_filters' 
  },
  {
    id: 'full_tour',
    title: 'סיור מודרך במערכת',
    keywords: ['tour', 'TOUR', 'סיור', 'הדרכה', 'מה יש', 'איך עובד', 'להכיר', 'סיבוב', 'הסבר', 'תראה לי', 'מה עושים', 'מה האתר', 'מה המערכת', 'איך משתמשים', 'חדש', 'עזרה', 'Help', 'מדריך', 'הסברים', 'איפה מה'],
    context: ['מערכת', 'התחלה', 'כללי', 'הבנה'],
    description: 'אשמח לעשות לך סיור מודרך! נראה את לוח הבקרה, ניהול הנוכחות, סידור העבודה וניהול העובדים.',
    stepId: 'full_tour' // Managed by handleAction
  }
];

export function GlobalAiSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatOpen, openChat, closeChat } = useChat();
  const { showAiSupport, setShowAiSupport } = useTheme();
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isNearDrop, setIsNearDrop] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const getWelcomeMessage = () => ({
    id: "welcome",
    isBot: true,
    text: `שלום ${user?.first_name || user?.username || 'משתמש'}!
      אני עוזר הניווט והתמיכה של מערכת תורן.

      שימו לב: אני עוזר מונחה כללים לחיפוש עזרה, ולא צ'אט בינה מלאכותית (AI) חופשי.

איך אוכל לעזור? הקלידו שאלה פשוטה:
• "איך מייצאים דו"חות לאקסל?"
• "איך משבצים משמרת?"
• "איך מפיקים דוח נוכחות?"
• "איך מעדכנים פרופיל?"`,
    timestamp: new Date().toISOString()
  });

  const getStorageKey = () => user?.id ? `ai_support_messages_${user.id}` : 'ai_support_messages';

  const [messages, setMessages] = useState<Message[]>([]);

  // Load user specific messages
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([getWelcomeMessage()]);
      }
    }
  }, [isOpen, user?.id]);

  const [isSingleStep, setIsSingleStep] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [currentTourIndex, setCurrentTourIndex] = useState<number>(() => {
    const saved = localStorage.getItem('active_tour_index');
    return saved ? parseInt(saved, 10) : -1;
  });
  const [showTourCompletion, setShowTourCompletion] = useState(false);

  useEffect(() => {
    const handleOpenSupport = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    const handleNavigateToSettings = () => {
      navigate('/settings?tab=appearance');
    };
    window.addEventListener('open-ai-support', handleOpenSupport);
    window.addEventListener('navigate-to-settings', handleNavigateToSettings);
    return () => {
      window.removeEventListener('open-ai-support', handleOpenSupport);
      window.removeEventListener('navigate-to-settings', handleNavigateToSettings);
    };
  }, [navigate]);

  useEffect(() => {
    if (currentTourIndex >= 0) {
      const step = TOUR_STEPS[currentTourIndex];
      if (step) {
        localStorage.setItem('active_tour_index', currentTourIndex.toString());
        localStorage.setItem('active_tour_step_id', step.id);
        window.dispatchEvent(new CustomEvent('tour-step-changed', {
          detail: { index: currentTourIndex, stepId: step.id }
        }));
      }
    } else {
      localStorage.removeItem('active_tour_index');
      localStorage.removeItem('active_tour_step_id');
      window.dispatchEvent(new CustomEvent('tour-step-changed', {
        detail: { index: -1, stepId: null }
      }));
    }
  }, [currentTourIndex]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(messages));
    }
  }, [messages]);

  const handleResetChat = () => {
    localStorage.removeItem(getStorageKey());
    setMessages([getWelcomeMessage()]);
    setShowSettingsMenu(false);
    toast.info("השיחה אופסה");
  };

  const handleShowWelcomeMessage = () => {
    setMessages(prev => [...prev, {
      ...getWelcomeMessage(),
      id: `welcome-${Date.now()}`
    }]);
    setShowSettingsMenu(false);
    setShowHistory(false);
  };

  // Auto open/close chat sidebar during guided tour if a step requires it
  useEffect(() => {
    if (currentTourIndex >= 0 && !isSingleStep) {
      const step = TOUR_STEPS[currentTourIndex];
      if (step?.id === 'chat_status_step' || step?.id === 'group_message_step') {
        if (!isChatOpen) {
          openChat(null as any);
        }
      } else {
        if (isChatOpen) {
          closeChat();
        }
      }
    }
  }, [currentTourIndex, isSingleStep, isChatOpen, openChat, closeChat]);

  // --- SMART MATCHING ENGINE 2.0 ---
  // Auto-navigate during tour if step is on a different page or tab
  useEffect(() => {
    if (currentTourIndex >= 0 && !isSingleStep) {
      const step = TOUR_STEPS[currentTourIndex];
      if (step) {
        const needsNav = step.path.includes('?') 
          ? (location.pathname + location.search) !== step.path
          : location.pathname !== step.path;
        
        if (needsNav) {
          navigate(step.path);
        }
      }
    }
  }, [currentTourIndex, isSingleStep, location.pathname, location.search, navigate]);

  const findMatches = (input: string) => {
    const text = input.toLowerCase().trim();
    if (!text) return [];

    // Filter out stop words (noise)
    const noiseWords = ['אני', 'עושה', 'שלי', 'את', 'איפה', 'איך', 'עושים', 'רוצה', 'לדעת', 'לי', 'לנו', 'מתי', 'כמה', 'לשבוע', 'הקרוב', 'של', 'בבקשה', 'תגיד', 'שלום', 'היי', 'אשמח', 'צריך', 'יכול', 'מישהו', 'אפשר', 'מחפש'];
    const cleanTokens = text.split(/\s+/).filter(t => !noiseWords.includes(t) && t.length > 1);

    const scoredMatches = KNOWLEDGE_BASE.map(item => {
      let score = 0;
      
      // 1. Exact title match (Highest)
      if (text.includes(item.title.toLowerCase())) score += 100;

      // 2. Strong Keywords (High weight)
      item.keywords.forEach(k => {
        if (text.includes(k.toLowerCase())) {
          score += 45; // Increased weight
          // Bonus for exact token match
          if (cleanTokens.includes(k.toLowerCase())) score += 25;
        }
      });

      // 3. Contextual overlap (Low weight)
      item.context.forEach(c => {
        if (text.includes(c.toLowerCase())) score += 15;
      });

      // 4. Token overlap
      const matchingTokens = cleanTokens.filter(t => 
        item.keywords.some(k => k.includes(t)) || 
        item.title.toLowerCase().includes(t)
      );
      if (matchingTokens.length > 0) score += (matchingTokens.length * 20);

      return { ...item, score };
    });

    // Only return matches with significant score - Lowered threshold for more flexibility
    return scoredMatches
      .filter(m => m.score >= 30) 
      .sort((a, b) => b.score - a.score);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: chatInput, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");

    setTimeout(() => {
      const q = currentInput.toLowerCase().trim();
      const matches = findMatches(q);

      // logic for " Grey Area" - if top match is not dominant, show suggestions
      const topMatch = matches[0];
      const isDominant = topMatch && (!matches[1] || (topMatch.score > matches[1].score + 35));

      if (isDominant) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), text: topMatch.description, isBot: true,
          action: { label: "קח אותי לשם", stepId: topMatch.stepId }
        }]);
      } else if (matches.length > 0) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), text: "מצאתי כמה דברים שקשורים לבקשה שלך. למה התכוונת?", isBot: true,
          suggestions: matches.slice(0, 4).map(m => ({ label: m.title, stepId: m.stepId }))
        }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "אני לא בטוח שהבנתי... תוכל לשאול על סינון וחיפוש, משמרות, הוספת עובד, הפקת דוחות או עיצוב המערכת.", isBot: true }]);
      }
    }, 600);
  };

  const handleAction = (stepId: string) => {
    if (stepId === 'full_tour') {
      setIsSingleStep(false);
      setIsOpen(false);
      const firstStep = TOUR_STEPS[0];
      const needsNav = firstStep.path.includes('?') 
        ? (location.pathname + location.search) !== firstStep.path
        : location.pathname !== firstStep.path;

      if (needsNav) {
        navigate(firstStep.path);
        setTimeout(() => setCurrentTourIndex(0), 500);
      } else {
        setCurrentTourIndex(0);
      }
      return;
    }

    const stepIdx = TOUR_STEPS.findIndex(s => s.id === stepId);
    if (stepIdx >= 0) {
      setIsSingleStep(true);
      setIsOpen(false);
      const step = TOUR_STEPS[stepIdx];
      const needsNav = step.path.includes('?') 
        ? (location.pathname + location.search) !== step.path
        : location.pathname !== step.path;

      if (needsNav) {
        navigate(step.path);
        setTimeout(() => setCurrentTourIndex(stepIdx), 500);
      } else {
        setCurrentTourIndex(stepIdx);
      }
    }
  };

  const handleCloseSpotlight = () => {
    setCurrentTourIndex(-1);
    setIsOpen(true);
    if (isChatOpen) {
      closeChat();
    }
  };

  const isSettingsPage = location.pathname === "/settings";
  const isMessagesTab = location.pathname === "/feedback" && new URLSearchParams(location.search).get("tab") === "messages";

  return (
    <>
      <TourGuideOverlay 
        steps={TOUR_STEPS} 
        currentStepIndex={currentTourIndex} 
        isActive={currentTourIndex >= 0 || showTourCompletion} 
        showCompletion={showTourCompletion}
        onCloseCompletion={() => {
          setShowTourCompletion(false);
          setCurrentTourIndex(-1);
          localStorage.removeItem('active_tour_index');
        }}
        onNext={() => {
          if (isSingleStep) {
            handleCloseSpotlight();
          } else if (currentTourIndex === TOUR_STEPS.length - 1) {
            setShowTourCompletion(true);
          } else {
            setCurrentTourIndex(i => i + 1);
          }
        }} 
        onPrev={() => setCurrentTourIndex(i => i - 1)} 
        isSingleStep={isSingleStep} 
        onClose={handleCloseSpotlight} 
      />

      {showAiSupport && (
        <>
          {/* Drag-off hint overlay - only shown while dragging */}
          {isDragging && (
            <div className="fixed inset-0 z-[99] pointer-events-none">
              {/* Edge "trash" zone indicators */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-16 flex items-center justify-center text-xs font-bold tracking-widest transition-all duration-200",
                isNearDrop ? "bg-red-500/20 text-red-500" : "bg-muted/10 text-muted-foreground/40"
              )}>
                {isNearDrop ? "🗑️ שחרר כדי להסתיר" : "גרור לקצה המסך להסתרה"}
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center text-xs font-bold tracking-widest transition-all duration-200",
                isNearDrop ? "bg-red-500/20 text-red-500" : "bg-muted/10 text-muted-foreground/40"
              )}>
                {isNearDrop ? "🗑️ שחרר כדי להסתיר" : "גרור לקצה המסך להסתרה"}
              </div>
            </div>
          )}

          <motion.div 
            key={`fab-container-${isOpen}-${isMinimized}-${resetKey}`}
            drag
            dragConstraints={false}
            dragElastic={0.15}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDrag={(_, info) => {
              // Check if near any screen edge (within 60px)
              const nearLeft = info.point.x < 60;
              const nearRight = info.point.x > window.innerWidth - 60;
              const nearTop = info.point.y < 60;
              const nearBottom = info.point.y > window.innerHeight - 60;
              setIsNearDrop(nearLeft || nearRight || nearTop || nearBottom);
            }}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              setIsNearDrop(false);

              // Check if dragged off any screen edge
              const offLeft = info.point.x < 0;
              const offRight = info.point.x > window.innerWidth;
              const offTop = info.point.y < 0;
              const offBottom = info.point.y > window.innerHeight;
              const isOffScreen = offLeft || offRight || offTop || offBottom;

              // Also check if near any edge (within 40px) for a generous feel
              const nearLeft = info.point.x < 40;
              const nearRight = info.point.x > window.innerWidth - 40;
              const nearTop = info.point.y < 40;
              const nearBottom = info.point.y > window.innerHeight - 40;
              const isNearEdge = nearLeft || nearRight || nearTop || nearBottom;

              if (isOffScreen || isNearEdge) {
                setShowAiSupport(false);
                toast.info("כפתור הסיוע הוסתר", {
                  description: "כדי להחזיר אותו, עבור להגדרות → נראות → כפתור סיוע AI",
                  position: "top-center",
                  duration: 8000,
                  action: {
                    label: "פתח הגדרות",
                    onClick: () => {
                      window.dispatchEvent(new CustomEvent('navigate-to-settings'));
                    }
                  }
                });
              } else {
                if (Math.abs(info.offset.x) > 20 || Math.abs(info.offset.y) > 20) {
                  setHasMoved(true);
                }
              }
            }}
            className={cn(
              "global-ai-support-btn fixed left-6 z-[100] flex flex-col items-center gap-2", 
              isSettingsPage ? "bottom-24 sm:bottom-6" : "bottom-6",
              (isMessagesTab || (isOpen && !isMinimized) || (currentTourIndex >= 0 && TOUR_STEPS[currentTourIndex]?.path === location.pathname)) && "hidden"
            )}
          >
            <AnimatePresence>
              {hasMoved && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHasMoved(false);
                    setResetKey(k => k + 1);
                  }}
                  className="w-8 h-8 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg flex items-center justify-center border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors pointer-events-auto"
                  title="החזר למקום מקורי"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Select Menu */}
            <AnimatePresence>
              {showQuickMenu && !isDragging && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="absolute bottom-16 left-0 w-52 flex flex-col gap-1.5 pointer-events-auto"
                >
                  {/* Bug Report */}
                  <motion.button
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0 }}
                    onClick={() => {
                      setShowQuickMenu(false);
                      navigate('/feedback?tab=send');
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-border/40 shadow-lg hover:shadow-xl hover:border-red-400/40 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all group text-right"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground">דיווח על באג</p>
                      <p className="text-[9px] text-muted-foreground font-medium">שלח פנייה לצוות</p>
                    </div>
                  </motion.button>

                  {/* Commander Chat */}
                  <motion.button
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 }}
                    onClick={() => {
                      setShowQuickMenu(false);
                      openChat();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-border/40 shadow-lg hover:shadow-xl hover:border-blue-400/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group text-right"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground">צ'אט מפקדים</p>
                      <p className="text-[9px] text-muted-foreground font-medium">תקשורת פנים-יחידתית</p>
                    </div>
                  </motion.button>

                  {/* AI Support */}
                  <motion.button
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 }}
                    onClick={() => {
                      setShowQuickMenu(false);
                      setIsOpen(true);
                      setIsMinimized(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group text-right"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground">צ'אט תמיכה</p>
                      <p className="text-[9px] text-muted-foreground font-medium">עזרה וניווט במערכת</p>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: isDragging ? 1 : 1.1 }} 
              whileTap={{ scale: 0.9 }}
              animate={isNearDrop ? { scale: 0.7, opacity: 0.5 } : { scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => { if (!isDragging) { setShowQuickMenu(prev => !prev); } }}
              className={cn(
                "w-14 h-14 rounded-full text-primary-foreground shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto transition-colors",
                showQuickMenu ? "bg-slate-700 dark:bg-slate-600" : "bg-primary"
              )}
              title="גרור לקצה המסך כדי להסתיר"
            >
              <motion.div animate={{ rotate: showQuickMenu ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <HelpCircle className="w-6 h-6" />
              </motion.div>
            </motion.button>
          </motion.div>
        </>
      )}


      <AnimatePresence>
        {isOpen && !isMinimized && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] sm:hidden"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-4 sm:bottom-6 sm:left-6 sm:right-auto sm:inset-x-auto w-auto sm:w-[380px] h-[calc(100dvh-32px)] sm:h-[600px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[200] flex flex-col border border-border overflow-hidden text-right"
              style={{ direction: "rtl" }}
            >
            <div 
              onDoubleClick={() => setIsMinimized(true)} 
              className="p-5 bg-white dark:bg-slate-900 border-b border-border/40 text-foreground flex items-center justify-between cursor-pointer relative z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-black text-xs uppercase text-slate-800 dark:text-slate-100">צ'אט תמיכה</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleShowWelcomeMessage} 
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="הצג הודעת הסבר"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="הגדרות צ'אט"
                  >
                    <Cog className="w-4 h-4" />
                  </button>
                  
                  {showSettingsMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                      <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border p-1.5 z-50 flex flex-col gap-1">
                        <button 
                          onClick={() => {
                            setShowHistory(!showHistory);
                            setShowSettingsMenu(false);
                          }} 
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-right w-full"
                        >
                          <History className="w-4 h-4 text-slate-400" />
                          <span>{showHistory ? "חזור לצ'אט" : "היסטוריית חיפושים"}</span>
                        </button>
                        <button 
                          onClick={handleResetChat} 
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-right w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>איפוס שיחה</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              {showHistory ? (
                <div className="h-full overflow-y-auto p-5 space-y-2 no-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">חיפושים אחרונים</h4>
                    <button onClick={() => setShowHistory(false)} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">חזור לצ'אט</button>
                  </div>
                  {messages.filter(m => !m.isBot).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <History className="w-8 h-8 mb-2" />
                      <p className="text-xs font-bold text-center">אין היסטוריית חיפושים עדיין</p>
                    </div>
                  ) : (
                    [...messages].reverse().filter(m => !m.isBot).map((msg, idx) => (
                      <div 
                        key={`${msg.id}-${idx}`} 
                        onClick={() => {
                          setChatInput(msg.text);
                          setShowHistory(false);
                        }} 
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-primary/10 dark:hover:bg-slate-700 border border-border/50 flex justify-between items-center group transition-colors"
                      >
                        <span className="truncate pl-2">{msg.text}</span>
                        <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-5 space-y-4 no-scrollbar text-right">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-2">
                      <div className={cn(
                        "p-4 rounded-[1.5rem] text-[12px] font-bold shadow-sm text-right whitespace-pre-line leading-relaxed", 
                        msg.isBot 
                          ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ml-8 mr-0 rounded-tl-none border border-border/50" 
                          : "bg-primary/15 dark:bg-primary/25 border border-primary/30 text-slate-800 dark:text-slate-100 mr-8 ml-0 rounded-tr-none shadow-sm text-left"
                      )} style={msg.isBot ? {} : { direction: "ltr" }}>
                        {msg.text}
                      </div>
                      {msg.isBot && msg.action && (
                        <Button variant="outline" size="sm" className="mr-8 ml-0 self-start rounded-xl border-emerald-200 text-emerald-600 font-black text-[11px] h-9 gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => handleAction(msg.action!.stepId)}>
                          <ExternalLink className="w-3.5 h-3.5" />{msg.action.label}
                        </Button>
                      )}
                      {msg.isBot && msg.suggestions && (
                        <div className="mr-8 ml-0 flex flex-col gap-2">
                          {msg.suggestions.map((s, idx) => (
                            <Button key={idx} variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary font-black text-[11px] h-9 justify-start gap-2 hover:bg-primary/10 dark:hover:bg-primary/20" onClick={() => handleAction(s.stepId)}>
                              <HelpCircle className="w-3.5 h-3.5" />{s.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="שאל אותי משהו..." className="flex-grow bg-transparent border-none text-slate-800 dark:text-slate-100 text-xs font-bold px-3 focus:ring-0 text-right" style={{ direction: "rtl" }} />
                <button type="submit" className="w-10 h-10 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl flex items-center justify-center shadow-sm transition-all"><Send className="w-4 h-4 transform rotate-180" /></button>
              </form>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 50, scale: 0.8, x: "-50%" }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[200] flex flex-col items-center gap-1.5 px-6 py-3 rounded-full border backdrop-blur-lg shadow-lg transition-all duration-200 pointer-events-none",
              isNearDrop 
                ? "bg-red-500/20 border-red-500/50 shadow-red-500/10 scale-110" 
                : "bg-background/80 border-border/60 shadow-black/5"
            )}
          >
            <Trash2 className={cn("w-5 h-5 transition-transform duration-200", isNearDrop ? "text-red-500 scale-120 rotate-12" : "text-muted-foreground")} />
            <span className={cn("text-[10px] font-black tracking-wider transition-colors duration-200", isNearDrop ? "text-red-500" : "text-muted-foreground")}>
              גרור לכאן להסתרה
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
