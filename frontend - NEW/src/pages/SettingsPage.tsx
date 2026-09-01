import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useBlocker } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import {
  User,
  Settings as SettingsIcon,
  Palette,
  ShieldCheck,
  Bell,
  Database,
  AlertTriangle,
  Save,
  Trash2,
  Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Import Settings Components
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { StatusAndServiceSettings } from "@/components/settings/StatusAndServiceSettings";

export default function SettingsPage() {
  const { user, refreshUser } = useAuthContext();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    showAiSupport,
    setShowAiSupport,
  } = useTheme();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-clear tutorial param after 5 seconds
  useEffect(() => {
    if (searchParams.get("tutorial")) {
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);
  const urlTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    urlTab || (user?.is_temp_commander ? "appearance" : "profile"),
  );

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else {
      setActiveTab(user?.is_temp_commander ? "appearance" : "profile");
    }
  }, [urlTab, user?.is_temp_commander]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    setSearchParams(newParams, { replace: true });
  };

  const canManageStatuses = useMemo(() => {
    if (!user) return false;
    return (
      user.is_admin ||
      user.is_commander ||
      user.is_department_commander ||
      user.is_section_commander ||
      user.is_team_commander ||
      !!user.commands_department_id ||
      !!user.commands_section_id ||
      !!user.commands_team_id ||
      user.is_temp_commander
    );
  }, [user]);

  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isServerBackingUp, setIsServerBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Backup Config State
  const [backupConfig, setBackupConfig] = useState({
    enabled: false,
    interval_days: 1,
    max_backups: 15,
    last_backup: null,
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (activeTab === "notifications" && user?.is_admin) {
      apiClient
        .get("/admin/settings")
        .then((res) => setSystemSettings(res.data))
        .catch((err) => console.error("Failed to load system settings", err));
    }
  }, [activeTab, user]);

  const updateSystemSetting = async (key: string, value: any) => {
    // Optimistic update
    setSystemSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await apiClient.post("/admin/settings", { key, value });
      toast.success("הגדרת מערכת עודכנה");
    } catch {
      toast.error("שגיאה בשמירת הגדרת מערכת");
    }
  };

  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  const fetchBackups = async () => {
    if (!user?.is_admin) return;
    setIsLoadingBackups(true);
    try {
      const res = await apiClient.get("/admin/backup/list");
      setBackups(res.data);
    } catch (err) {
      console.error("Failed to load backups list", err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === "backup" && user?.is_admin) {
      apiClient
        .get("/admin/backup/config")
        .then((res) => setBackupConfig(res.data))
        .catch((err) => console.error("Failed to load backup config", err));
      
      fetchBackups();
    }
  }, [activeTab, user]);

  const updateBackupConfig = async (key: string, value: any) => {
    const newConfig = { ...backupConfig, [key]: value };
    setBackupConfig(newConfig);
    try {
      await apiClient.post("/admin/backup/config", newConfig);
      toast.success("הגדרות הגיבוי עודכנו");
    } catch {
      toast.error("שגיאה בשמירת הגדרות");
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await apiClient.get("/admin/backup", {
        responseType: "blob",
      });

      // יצירת לינק להורדה
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `matzevet_backup_${date}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("הגיבוי הושלם בהצלחה");
      fetchBackups(); // Refresh list
    } catch (err) {
      toast.error("שגיאה בביצוע הגיבוי");
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleServerBackupNow = async () => {
    setIsServerBackingUp(true);
    try {
      const { data } = await apiClient.post("/admin/backup/now");
      if (data.success) {
        toast.success("גיבוי בוצע בהצלחה", {
          description: `נשמר בשם: ${data.file.split(/[\\/]/).pop()}`,
        });
        setBackupConfig((prev) => ({
          ...prev,
          last_backup: data.last_backup,
        }));
        fetchBackups(); // Refresh list
      }
    } catch (e) {
      toast.error("שגיאה בביצוע הגיבוי");
    } finally {
      setIsServerBackingUp(false);
    }
  };

  const handleDownloadBackupFile = async (filename: string) => {
    try {
      const response = await apiClient.get(`/admin/backup/download/${filename}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("הקובץ הורד בהצלחה");
    } catch (err) {
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  const handleToggleLockBackup = async (filename: string) => {
    try {
      const { data } = await apiClient.post(`/admin/backup/lock/${filename}`);
      toast.success(data.action === "locked" ? "הקובץ ננעל בהצלחה" : "נעילת הקובץ שוחררה");
      fetchBackups();
    } catch (err) {
      toast.error("שגיאה בעדכון נעילת הקובץ");
    }
  };

  const handleDeleteBackupFile = async (filename: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את קובץ הגיבוי ${filename}?`)) return;
    try {
      await apiClient.delete(`/admin/backup/delete/${filename}`);
      toast.success("קובץ הגיבוי נמחק בהצלחה");
      fetchBackups();
    } catch (err) {
      const errorMsg = (err as any).response?.data?.error || "שגיאה במחיקת הקובץ";
      toast.error(errorMsg);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "האם אתה בטוח שברצונך לשחזר נתונים? פעולה זו תדרוס את כל המידע הקיים!",
      )
    ) {
      event.target.value = ""; // איפוס הקלט
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post("/admin/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("הנתונים שוחזרו בהצלחה", {
        description: "רענן את הדף כדי לראות את השינויים",
      });
      // רענון אוטומטי של הדף לאחר השחזור
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error("שגיאה בשחזור הנתונים");
      console.error(err);
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  // Profile form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    email: "",
    city: "",
    birth_date: "",
    emergency_contact: "",
    notif_sick_leave: true,
    notif_transfers: true,
    notif_morning_report: true,
    enlistment_date: "",
    discharge_date: "",
    assignment_date: "",
    police_license: false,
    security_clearance: false,
    // New fields for commander display
    commands_department_id: null as number | null,
    department_name: "",
    commands_section_id: null as number | null,
    section_name: "",
    commands_team_id: null as number | null,
    team_name: "",
  });

  const [emergencyDetails, setEmergencyDetails] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const relations = [
    "בן / בת זוג",
    "אבא / אמא",
    "אח / אחות",
    "בן / בת",
    "סבא / סבתא",
    "חבר / חברה",
    "אחר",
  ];

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const draftKey = `profile_settings_draft_${user?.id || user?.username || "me"}`;

  // Initial user sync on load
  useEffect(() => {
    if (user) {
      // Check if user has an ongoing unsaved draft
      const savedDraft = localStorage.getItem(draftKey);
      let initialData: any = null;
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed?.data && Object.keys(parsed.data).length > 0) {
            initialData = parsed.data;
            setIsDirty(true);
          }
        } catch {}
      }

      if (!initialData) {
        initialData = {
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone_number: user.phone_number || "",
          email: user.email || "",
          city: user.city || "",
          username: user.username || "",
          birth_date: user.birth_date || "",
          emergency_contact: user.emergency_contact || "",
          notif_sick_leave: user.notif_sick_leave !== false,
          notif_transfers: user.notif_transfers !== false,
          notif_morning_report: user.notif_morning_report !== false,
          enlistment_date: user.enlistment_date || "",
          discharge_date: user.discharge_date || "",
          assignment_date: user.assignment_date || "",
          police_license: !!user.police_license,
          security_clearance: !!user.security_clearance,
          commands_department_id: user.commands_department_id ?? null,
          department_name: user.department_name ?? "",
          commands_section_id: user.commands_section_id ?? null,
          section_name: user.section_name ?? "",
          commands_team_id: user.commands_team_id ?? null,
          team_name: user.team_name ?? "",
        };
        setIsDirty(false);
      }

      setFormData(initialData);

      // Parse Emergency Contact
      const eContact = initialData.emergency_contact || user.emergency_contact || "";
      if (eContact) {
        const match = eContact.match(/^(.*) \((.*)\) - (.*)$/);
        if (match) {
          setEmergencyDetails({
            name: match[1],
            relation: match[2],
            phone: match[3],
          });
        } else {
          setEmergencyDetails({
            name: eContact,
            relation: "",
            phone: "",
          });
        }
      }
    }
  }, [user, draftKey]);

  // Wrapped updater to mark form as dirty when user edits
  const handleFormDataChange = (updater: any) => {
    setIsDirty(true);
    setFormData(updater);
  };

  const handleEmergencyDetailsChange = (updater: any) => {
    setIsDirty(true);
    setEmergencyDetails(updater);
  };

  // Save draft on change
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ ts: Date.now(), data: formData })
      );
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [formData, isDirty, draftKey]);

  // Window beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Navigation Blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Boolean(isDirty && currentLocation.pathname !== nextLocation.pathname)
  );

  const isBlocked = blocker.state === "blocked";
  const showUnsavedPrompt = Boolean(isDirty && (showUnsavedModal || isBlocked));

  useEffect(() => {
    refreshUser();
  }, []);

  // Update formData when emergencyDetails changes
  useEffect(() => {
    const { name, relation, phone } = emergencyDetails;
    if (name || relation || phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contact: `${name} (${relation}) - ${phone}`,
      }));
    }
  }, [emergencyDetails]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        security_clearance: formData.security_clearance,
        birth_date: formData.birth_date || null,
        enlistment_date: formData.enlistment_date || null,
        discharge_date: formData.discharge_date || null,
        assignment_date: formData.assignment_date || null,
      };
      const { data } = await apiClient.put("/auth/update-profile", payload);
      if (data.success) {
        setIsDirty(false);
        localStorage.removeItem(draftKey);
        await refreshUser();
        toast.success("ההגדרות עודכנו בהצלחה", {
          description: "השינויים נשמרו במערכת",
        });
        if (blocker.state === "blocked") {
          blocker.proceed();
        } else if (pendingNavigationPath) {
          navigate(pendingNavigationPath);
        }
      } else {
        toast.error("שגיאה בעדכון ההגדרות", {
          description: data.error,
        });
      }
    } catch (err: any) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 4) {
      toast.error("הסיסמה חייבת להכיל לפחות 4 תווים");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data } = await apiClient.post("/auth/change-password", {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      if (data.success) {
        toast.success("הסיסמה עודכנה בהצלחה");
        setPasswordData({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        toast.error(data.error || "שגיאה בעדכון הסיסמה");
      }
    } catch (err) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetImpersonatedPassword = async () => {
    if (!confirm("האם אתה בטוח שברצונך לאפס את סיסמת המשתמש לסיסמת ברירת המחדל (123456)?")) {
      return;
    }

    try {
      setIsResetting(true);
      const response = await apiClient.post(
        "/auth/reset-impersonated-password",
      );
      if (response.status === 200) {
        toast.success("הסיסמא אופסה בהצלחה (123456)");
      }
    } catch (error) {
      console.error(error);
      toast.error("שגיאה באיפוס הסיסמה");
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmCurrentPassword = async () => {
    try {
      const { data } = await apiClient.post("/auth/confirm-password");
      if (data.success) {
        await refreshUser();
        toast.success("תוקף הסיסמה הוארך ב-6 חודשים");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("שגיאה בתקשורת עם השרת");
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="hidden sm:block pt-6 pb-4 shrink-0 transition-all px-4 sm:px-6">
        <PageHeader
          icon={SettingsIcon}
          title="הגדרות מערכת"
          className="mb-0"
          hideMobile={true}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Desktop Horizontal Navigation (Replaces Sidebar on Desktop) */}
        <div className="hidden lg:flex items-center gap-1 border-b border-border sticky top-[-35px] bg-background/95 backdrop-blur z-50 pb-0 overflow-x-auto no-scrollbar pt-2 px-4">
          {!user?.is_temp_commander && (
            <TabItem
              id="profile-tab"
              label="פרופיל אישי"
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
              className={cn(
                searchParams.get("tutorial") === "profile" &&
                  "tutorial-highlight",
              )}
            />
          )}
          {canManageStatuses && (
            <TabItem
              id="statuses-tab"
              label="סטטוסים ומעמד"
              active={activeTab === "statuses"}
              onClick={() => handleTabChange("statuses")}
            />
          )}
          <TabItem
            id="appearance-tab"
            label="מראה ותצוגה"
            active={activeTab === "appearance"}
            onClick={() => handleTabChange("appearance")}
            className={cn(
              searchParams.get("tutorial") === "settings" &&
                "tutorial-highlight",
            )}
          />
          {!user?.is_temp_commander && (
            <TabItem
              id="security-tab"
              label="אבטחה"
              active={activeTab === "security"}
              onClick={() => handleTabChange("security")}
            />
          )}
          {!user?.is_temp_commander && (
            <TabItem
              id="notifications-tab"
              label="התראות"
              active={activeTab === "notifications"}
              onClick={() => handleTabChange("notifications")}
            />
          )}
          {user?.is_admin && (
            <TabItem
              id="backup-tab"
              label="גיבוי ושחזור"
              active={activeTab === "backup"}
              onClick={() => handleTabChange("backup")}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="min-w-0 mt-8 pb-24 lg:pb-8">
          {activeTab === "profile" && !user?.is_temp_commander && (
            <ProfileSettings
              user={user}
              formData={formData}
              setFormData={handleFormDataChange}
              emergencyDetails={emergencyDetails}
              setEmergencyDetails={handleEmergencyDetailsChange}
              relations={relations}
              isSaving={isSaving}
              handleSaveProfile={handleSaveProfile}
              readOnly={!!user?.is_temp_commander}
            />
          )}

          {activeTab === "appearance" && (
            <AppearanceSettings
              theme={theme}
              setTheme={setTheme}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              fontSize={fontSize}
              setFontSize={setFontSize}
              showAiSupport={showAiSupport}
              setShowAiSupport={setShowAiSupport}
            />
          )}

          {activeTab === "security" && !user?.is_temp_commander && (
            <>
              <SecuritySettings
                user={user}
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                showPasswords={showPasswords}
                setShowPasswords={setShowPasswords}
                isChangingPassword={isChangingPassword}
                handleChangePassword={handleChangePassword}
                isResetting={isResetting}
                handleResetImpersonatedPassword={
                  handleResetImpersonatedPassword
                }
                handleConfirmCurrentPassword={handleConfirmCurrentPassword}
                onForgotPassword={async () => {
                  if (!user?.email) {
                    toast.error(
                      "לא מוגדרת כתובת אימייל בפרופיל שלך. פנה למנהל המערכת.",
                      {
                        description: "ניתן לעדכן אימייל בלשונית 'פרופיל אישי'",
                      },
                    );
                    return;
                  }

                  try {
                    const { data } = await apiClient.post(
                      "/auth/forgot-password",
                      {
                        email: user.email,
                      },
                    );
                    if (data.success) {
                      toast.success("קוד אימות נשלח למייל שלך", {
                        description: `נשלח לכתובת: ${user.email}`,
                      });
                    } else {
                      toast.error(data.error || "שגיאה בשליחת קוד אימות");
                    }
                  } catch (err) {
                    toast.error("שגיאה בתקשורת עם השרת");
                  }
                }}
              />
            </>
          )}

          {activeTab === "notifications" && !user?.is_temp_commander && (
            <NotificationSettings
              user={user}
              formData={formData}
              setFormData={setFormData}
              systemSettings={systemSettings}
              updateSystemSetting={updateSystemSetting}
            />
          )}

          {activeTab === "statuses" && canManageStatuses && (
            <StatusAndServiceSettings />
          )}

          {activeTab === "backup" && user?.is_admin && (
            <BackupSettings
              backupConfig={backupConfig}
              updateBackupConfig={updateBackupConfig}
              isServerBackingUp={isServerBackingUp}
              handleServerBackupNow={handleServerBackupNow}
              isBackingUp={isBackingUp}
              handleBackup={handleBackup}
              isRestoring={isRestoring}
              handleRestore={handleRestore}
              backups={backups}
              isLoadingBackups={isLoadingBackups}
              handleDownloadBackupFile={handleDownloadBackupFile}
              handleDeleteBackupFile={handleDeleteBackupFile}
              handleToggleLockBackup={handleToggleLockBackup}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation Bar - Standard Fixed */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border flex justify-around items-center h-16 px-1 safe-area-bottom overflow-x-auto no-scrollbar">
          {!user?.is_temp_commander && (
            <MobileBottomNavLink
              id="mobile-profile-tab"
              label="פרופיל"
              icon={User}
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
            />
          )}
          {canManageStatuses && (
            <MobileBottomNavLink
              id="mobile-statuses-tab"
              label="סטטוסים"
              icon={Briefcase}
              active={activeTab === "statuses"}
              onClick={() => handleTabChange("statuses")}
            />
          )}
          <MobileBottomNavLink
            label="תצוגה"
            icon={Palette}
            active={activeTab === "appearance"}
            onClick={() => handleTabChange("appearance")}
          />
          {!user?.is_temp_commander && (
            <MobileBottomNavLink
              id="mobile-security-tab"
              label="אבטחה"
              icon={ShieldCheck}
              active={activeTab === "security"}
              onClick={() => handleTabChange("security")}
            />
          )}
          {!user?.is_temp_commander && (
            <MobileBottomNavLink
              label="התראות"
              icon={Bell}
              active={activeTab === "notifications"}
              onClick={() => handleTabChange("notifications")}
            />
          )}
          {user?.is_admin && (
            <MobileBottomNavLink
              label="גיבוי"
              icon={Database}
              active={activeTab === "backup"}
              onClick={() => handleTabChange("backup")}
            />
          )}
        </div>
        {/* Unsaved Changes Confirmation Modal */}
        <Dialog
          open={showUnsavedPrompt}
          onOpenChange={(open) => {
            if (!open) {
              setShowUnsavedModal(false);
              if (blocker.state === "blocked") {
                blocker.reset();
              }
            }
          }}
        >
          <DialogContent
            className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 text-right p-0 overflow-hidden"
            dir="rtl"
          >
            <DialogHeader className="p-6 bg-amber-500/5 pb-4 border-b border-amber-500/10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-black text-center text-foreground mb-1">
                שינויים שלא נשמרו
              </DialogTitle>
              <DialogDescription className="text-center font-bold text-muted-foreground text-sm">
                ביצעת שינויים בהגדרות הפרופיל שטרם נשמרו. כיצד ברצונך להמשיך?
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-3">
              <Button
                className="w-full h-12 text-sm font-black rounded-xl gap-2 shadow-sm"
                onClick={async () => {
                  setShowUnsavedModal(false);
                  await handleSaveProfile();
                }}
              >
                <Save className="w-4 h-4" />
                שמור שינויים וצא
              </Button>

              <Button
                variant="destructive"
                className="w-full h-12 text-sm font-black rounded-xl gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                onClick={() => {
                  setIsDirty(false);
                  localStorage.removeItem(draftKey);
                  if (user) {
                    setFormData({
                      first_name: user.first_name || "",
                      last_name: user.last_name || "",
                      phone_number: user.phone_number || "",
                      email: user.email || "",
                      city: user.city || "",
                      username: user.username || "",
                      birth_date: user.birth_date || "",
                      emergency_contact: user.emergency_contact || "",
                      notif_sick_leave: user.notif_sick_leave !== false,
                      notif_transfers: user.notif_transfers !== false,
                      notif_morning_report: user.notif_morning_report !== false,
                      enlistment_date: user.enlistment_date || "",
                      discharge_date: user.discharge_date || "",
                      assignment_date: user.assignment_date || "",
                      police_license: !!user.police_license,
                      security_clearance: !!user.security_clearance,
                      commands_department_id: user.commands_department_id ?? null,
                      department_name: user.department_name ?? "",
                      commands_section_id: user.commands_section_id ?? null,
                      section_name: user.section_name ?? "",
                      commands_team_id: user.commands_team_id ?? null,
                      team_name: user.team_name ?? "",
                    });
                  }
                  setShowUnsavedModal(false);
                  toast.info("השינויים בוטלו");
                  if (blocker.state === "blocked") {
                    blocker.proceed();
                  } else if (pendingNavigationPath) {
                    navigate(pendingNavigationPath);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                מחק טיוטה וצא ללא שמירה
              </Button>

              <Button
                variant="ghost"
                className="w-full h-11 text-sm font-bold rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowUnsavedModal(false);
                  if (blocker.state === "blocked") {
                    blocker.reset();
                  }
                }}
              >
                המשך עריכה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MobileBottomNavLink({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id?: string;
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div
        className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/10" : "bg-transparent"}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
      {active && (
        <span className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full " />
      )}
    </button>
  );
}

function TabItem({
  id,
  label,
  active,
  onClick,
  className,
}: {
  id?: string;
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        "relative px-4 py-2.5 rounded-lg transition-all font-bold text-sm whitespace-nowrap",
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className,
      )}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-2" />
      )}
    </button>
  );
}
