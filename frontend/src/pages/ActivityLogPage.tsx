import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  History,
  Activity,
  AlertTriangle,
  Laptop2,
  ChevronDown,
  Loader2,
  Search,
  Shield,
  Calendar,
  Filter as FilterIcon,
  ArrowRight,
  Download,
  Info,
  RefreshCw,
  User,
  ArrowLeftRight,
  Settings,
  Lock,
  Archive,
  FileText,
  Wifi,
  Cpu,
  Terminal,
  Clock,
  Fingerprint,
  X,
  UserCheck,
  Zap,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";

// Mapping action types to Hebrew labels and icons
const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  LOGIN: { label: "התחברות", icon: Laptop2, color: "text-blue-600", bg: "bg-blue-500/10" },
  FAILED_LOGIN: { label: "ניסיון כושל", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
  BLOCKED_LOGIN: { label: "כניסה נחסמה", icon: Shield, color: "text-red-600", bg: "bg-red-500/10" },
  PASSWORD_CHANGE: { label: "שינוי סיסמה", icon: Lock, color: "text-amber-600", bg: "bg-amber-500/10" },
  PROFILE_UPDATE: { label: "עדכון פרופיל", icon: User, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  TRANSFER_CREATE: { label: "בקשת העברה", icon: ArrowLeftRight, color: "text-purple-600", bg: "bg-purple-500/10" },
  TRANSFER_APPROVE: { label: "אישור העברה", icon: ArrowLeftRight, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  TRANSFER_REJECT: { label: "דחיית העברה", icon: ArrowLeftRight, color: "text-red-600", bg: "bg-red-500/10" },
  IMPERSONATION_START: { label: "התחזות מנהל", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  WEBAUTHN_REGISTER: { label: "רישום Passkey", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  WEBAUTHN_LOGIN: { label: "התחברות ביומטרית", icon: Shield, color: "text-blue-600", bg: "bg-blue-500/10" },
  EMPLOYEE_CREATE: { label: "שוטר חדש", icon: User, color: "text-blue-600", bg: "bg-blue-500/10" },
  EMPLOYEE_UPDATE: { label: "עדכון שוטר", icon: Settings, color: "text-slate-600", bg: "bg-slate-500/10" },
  REPORT_STATUS: { label: "דיווח נוכחות", icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

export default function ActivityLogPage() {
  const { user } = useAuthContext();
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
  const [activeTab, setActiveTab] = useState<"all" | "suspicious" | "archives" | "my">("all");
  
  // Data states
  const [activity, setActivity] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(100);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "all") {
        const params = new URLSearchParams();
        params.append("limit", limit.toString());
        if (selectedUser) params.append("user_id", selectedUser);
        if (selectedAction) params.append("action_type", selectedAction);
        
        const { data } = await apiClient.get(`/audit/all-activity?${params.toString()}`);
        setActivity(data);
      } else if (activeTab === "my") {
        const { data } = await apiClient.get("/audit/my-activity");
        setActivity(data);
      } else if (activeTab === "suspicious") {
        const { data } = await apiClient.get("/audit/suspicious");
        setSuspicious(data);
      } else if (activeTab === "archives") {
        const { data } = await apiClient.get("/audit/archives");
        setArchives(data);
      }

      // Fetch users for filter if not already fetched and user is admin
      if (user?.is_admin && users.length === 0) {
        const { data: userData } = await apiClient.get("/employees?limit=1000");
        setUsers(userData.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity data", err);
      toast.error("נכשל בטעינת נתוני יומן הפעילות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get("/audit/export", {
        params: { limit: 1000 },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `full_system_audit_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success("הדוח המלא נוצר בהצלחה וייפתח כעת");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("נכשל בייצוא הדוח");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadArchive = async (filename: string) => {
    try {
      const response = await apiClient.get(`/audit/archives/${filename}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename.replace(".gz", ""));
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("הקובץ הורד בהצלחה");
    } catch {
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, limit, selectedUser, selectedAction]);

  const filteredLogs = useMemo(() => {
    const source = (activeTab === "all" || activeTab === "my") ? activity : activeTab === "suspicious" ? suspicious : [];
    if (activeTab === "archives") {
        return archives
            .filter(a => a.filename.toLowerCase().includes(archiveSearch.toLowerCase()))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return source.filter((log) => {
      // Free Search
      const searchStr = (
        (log.description || "") + 
        (log.action_type || "") + 
        (log.user_name || "") +
        (log.target_name || "") +
        (log.ip_address || "") +
        (log.reason || "")
      ).toLowerCase();
      
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      // Date Filter
      const logDate = new Date(log.created_at);
      const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
      
      // Status Filter
      const isSuspicious = log.action_type?.includes("FAILED") || log.action_type?.includes("BLOCKED") || !!log.reason;
      const isError = isSuspicious;
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "success" ? !isError : isError;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
    });
  }, [activity, suspicious, archives, activeTab, searchTerm, archiveSearch, dateFrom, dateTo, statusFilter]);

  const clearFilters = () => {
    setSelectedUser("");
    setSelectedAction("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setSearchTerm("");
    setArchiveSearch("");
  };

  const hasActiveFilters = selectedUser || selectedAction || dateFrom || dateTo || statusFilter !== "all" || searchTerm || archiveSearch;

  const isAccessAllowed = user?.is_admin || user?.is_commander || activeTab === "my";

  if (!isAccessAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 rounded-[2.5rem] border-border/40 text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mx-auto">
            <Shield className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">אין הרשאת גישה</h1>
            <p className="text-muted-foreground font-medium text-sm">
              עמוד זה מיועד למנהלי מערכת או מפקדים בלבד.
            </p>
          </div>
          <Button onClick={() => window.history.back()} className="w-full h-12 rounded-2xl font-black">
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה לדף הקודם
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden" dir="rtl">
      <div className="pt-5 pb-3 px-4 sm:px-6 shrink-0 transition-all">
        <PageHeader 
          id="activity-log-header"
          title="מרכז ניטור וביקורת"
          icon={History}
          className={cn(
            "mb-0",
            searchParams.get("tutorial") === "activity-log" && "tutorial-highlight"
          )}
          hideMobile={true}
          badge={
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="rounded-xl h-10 border-border/40 bg-card hover:bg-muted/50 font-bold text-xs"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-3.5 h-3.5 ml-2", isLoading && "animate-spin")} />
                רענן
              </Button>
              {user?.is_admin && (
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="rounded-xl h-10 font-black text-xs"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 ml-2 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 ml-2" />
                  )}
                  ייצוא דוח ביקורת מלא
                </Button>
              )}
            </div>
          }
        />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">

        {/* Main Content Card */}
        <Card className="rounded-2xl border-border/40 overflow-hidden flex flex-col min-h-[600px] bg-card/60 backdrop-blur-xl">
          {/* Custom Tabs */}
          <div className="flex bg-background/20 px-4 pt-4 border-b border-border/40 gap-1.5 overflow-x-auto no-scrollbar">
             <button onClick={() => setActiveTab("my")} className={cn("px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x", activeTab === "my" ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
               <div className="flex items-center gap-1.5">
                 <UserCheck className="w-3.5 h-3.5" />
                 הפעילות שלי
               </div>
             </button>

             {(user?.is_admin || user?.is_commander) && (
               <button onClick={() => setActiveTab("all")} className={cn("px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x", activeTab === "all" ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
                 <div className="flex items-center gap-1.5">
                   <FileText className="w-3.5 h-3.5" />
                   כל פעילות המערכת
                 </div>
               </button>
             )}

             {user?.is_admin && (
               <>
                 <button onClick={() => setActiveTab("suspicious")} className={cn("px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x", activeTab === "suspicious" ? "bg-card text-red-600 border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
                   <div className="flex items-center gap-1.5">
                     <AlertTriangle className="w-3.5 h-3.5" />
                     התראות ואנומליות
                   </div>
                 </button>
                 <button onClick={() => setActiveTab("archives")} className={cn("px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x", activeTab === "archives" ? "bg-card text-purple-600 border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
                   <div className="flex items-center gap-1.5">
                     <Archive className="w-3.5 h-3.5" />
                     ארכיון קבצים
                   </div>
                 </button>
               </>
             )}
          </div>

          {/* Toolbar & Advanced Filters */}
          <div className="p-4 border-b border-border/40 space-y-3 bg-background/20">
            <div className="flex flex-col lg:flex-row items-center gap-3">
                <div className="relative w-full lg:flex-1">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input 
                        placeholder={activeTab === "archives" ? "חפש לפי תאריך ארכיון..." : "חיפוש חופשי (משתמש, IP, תיאור)..."} 
                        value={activeTab === "archives" ? archiveSearch : searchTerm}
                        onChange={(e) => activeTab === "archives" ? setArchiveSearch(e.target.value) : setSearchTerm(e.target.value)}
                        className="pr-10 h-10 rounded-xl bg-background border-border/40 focus:ring-primary/20 transition-all font-bold text-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "rounded-xl h-10 px-4 text-xs font-bold flex-1 lg:flex-none border-border/40",
                            showFilters || hasActiveFilters ? "bg-primary/5 text-primary border-primary/20" : "bg-background"
                        )}
                    >
                        <FilterIcon className="w-3.5 h-3.5 ml-2" />
                        מסננים מתקדמים
                        {hasActiveFilters && <div className="mr-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </Button>
                    
                    {activeTab === "all" && (
                        <div className="hidden sm:flex items-center bg-background border border-border/40 rounded-xl p-0.5">
                            {[50, 100, 250].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setLimit(v)}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-[9px] font-black transition-all",
                                        limit === v ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Filter Panel */}
            <AnimatePresence>
                {(showFilters || hasActiveFilters) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-background/60 border-border/20 p-4 rounded-2xl mt-1.5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* User Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">משתמש מבצע</label>
                                    <select 
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full h-9 rounded-lg bg-background border border-border/40 px-3 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer transition-all hover:border-primary/20"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "left 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1em" }}
                                    >
                                        <option value="">כל המשתמשים</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} (@{u.id})</option>)}
                                    </select>
                                </div>

                                {/* Action Type Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">סוג פעולה</label>
                                    <select 
                                        value={selectedAction}
                                        onChange={(e) => setSelectedAction(e.target.value)}
                                        className="w-full h-9 rounded-lg bg-background border border-border/40 px-3 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer transition-all hover:border-primary/20"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "left 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1em" }}
                                    >
                                        <option value="">כל הסוגים</option>
                                        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter (Radio-like) */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">סטטוס פעולה</label>
                                    <div className="flex bg-card p-1 rounded-lg gap-1 border border-border/40 h-9 items-center">
                                        {[
                                            { id: "all", label: "הכל", icon: Activity },
                                            { id: "success", label: "תקין", icon: UserCheck },
                                            { id: "error", label: "שגיאות", icon: AlertTriangle }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setStatusFilter(s.id as any)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[9px] font-black transition-all h-7",
                                                    statusFilter === s.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/40"
                                                )}
                                            >
                                                <s.icon className="w-3 h-3" />
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">טווח תאריכים</label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="date" 
                                            value={dateFrom} 
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="h-9 rounded-lg bg-background border-border/40 text-[10px] font-bold py-0" 
                                        />
                                        <span className="text-muted-foreground text-xs">עד</span>
                                        <Input 
                                            type="date" 
                                            value={dateTo} 
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="h-9 rounded-lg bg-background border-border/40 text-[10px] font-bold py-0" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border/10">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/50 border border-border/40 px-2.5 py-1 rounded-full">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        נמצאו <span className="font-black text-foreground">{filteredLogs.length}</span> תוצאות מתאימות
                                    </div>
                                    {hasActiveFilters && (
                                        <button 
                                            onClick={clearFilters}
                                            className="text-[10px] font-black text-destructive hover:underline flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            נקה מסננים
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    size="sm" 
                                    className="rounded-lg h-8 px-4 font-black text-[10px]"
                                    onClick={() => setShowFilters(false)}
                                >
                                    החל וסגור
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* List Content */}
          <div className="flex-1 p-0 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center py-24 gap-3 opacity-40">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-xs font-bold tracking-widest uppercase">מעבד נתונים מהשרת...</span>
              </div>
            ) : activeTab === "archives" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredLogs.map((archive, idx) => (
                  <ArchiveCard 
                    key={archive.filename} 
                    archive={archive} 
                    index={idx}
                    onDownload={handleDownloadArchive} 
                  />
                ))}
                {filteredLogs.length === 0 && (
                   <div className="col-span-full py-24 text-center opacity-40">
                      <Archive className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-black text-sm">לא נמצאו ארכיונים תואמים</p>
                   </div>
                )}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-3">
                <div className="w-16 h-16 bg-background/50 border border-border/20 rounded-2xl flex items-center justify-center text-muted-foreground/20">
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-black">לא נמצאו תוצאות</p>
                  <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">
                    {activeTab === "my" ? "אין לך פעילות מתועדת במערכת עדיין." : "נסה לשנות את מונחי החיפוש או לבחור קטגוריה אחרת."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col divider-y divide-border/20">
                {activeTab === "my" && (
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-border/20 bg-muted/5">
                    <div className="w-1 h-3.5 bg-primary rounded-full" />
                    <h3 className="text-xs font-black text-foreground/75 uppercase tracking-tighter">
                      10 כניסות אחרונות למערכת ופעילות בחשבון
                    </h3>
                  </div>
                )}
                {filteredLogs.map((log, idx) => (
                  <ActivityEntry key={log.id} log={log} index={idx} isSuspicious={activeTab === "suspicious"} />
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-border/40 bg-background/20 flex items-center justify-center gap-2 shrink-0">
              <Info className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                {activeTab === "archives" 
                  ? "קבצי ארכיון נוצרים באופן אוטומטי עבור לוגים ישנים מ-7 ימים."
                  : "יומן המערכת מספק תיעוד מלא של 90 הימים האחרונים."}
              </span>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StatItem({ label, value, sub, color, className }: any) {
  return (
    <Card className={cn("group relative overflow-hidden p-3 rounded-xl transition-all flex items-center justify-between bg-card border-border/40 hover:border-primary/20 shadow-sm", className)}>
      <div className="flex items-center justify-between w-full gap-2">
        <div className="space-y-0.5 text-right min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/70 uppercase tracking-wider leading-none">
            {label}
          </p>
          <p className={cn("text-sm sm:text-base font-black tracking-tight leading-none mt-1.5", color.split(" ")[1])}>
            {value}
          </p>
          {sub && (
            <p className="text-[8px] font-bold text-muted-foreground/50 leading-none mt-1">
              {sub}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ArchiveCard({ archive, onDownload, index }: any) {
  // Extract date from filename audit_2026-04-19_111709.json.gz
  const extractReadableDate = (filename: string) => {
    try {
        const parts = filename.split("_");
        if (parts.length >= 2) {
            const datePart = parts[1]; // 2026-04-19
            return format(new Date(datePart), "eeee, d בMMMM yyyy", { locale: he });
        }
    } catch (e) {}
    return "תאריך לא מזוהה";
  };

  const readableName = extractReadableDate(archive.filename);

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
    >
        <Card className="group relative overflow-hidden rounded-2xl border-border/40 bg-card hover:border-primary/40 hover: transition-all p-4">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2.5rem] -mr-6 -mt-6 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Archive className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">סוג דוח</span>
                        <span className="text-xs font-black text-primary">ארכיון פעילות</span>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <h4 className="text-sm font-black tracking-tight leading-none">{readableName}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/60 font-mono ltr" dir="ltr">{archive.filename}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">גודל קובץ</span>
                        <span className="text-xs font-bold">{archive.size_kb} KB</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">נוצר ב-</span>
                        <span className="text-xs font-bold">{format(new Date(archive.created_at), "HH:mm")}</span>
                    </div>
                    <Button 
                        onClick={() => onDownload(archive.filename)}
                        className="rounded-xl h-9 w-9 p-0 hover:scale-105 transition-transform"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    </motion.div>
  );
}

function ActivityEntry({ log, index, isSuspicious }: { log: any, index: number, isSuspicious?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  // Find config or fallback
  const config = useMemo(() => {
    if (isSuspicious) return { label: log.reason || "אנומליה", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" };
    for (const key in ACTION_CONFIG) {
      if (log.action_type?.startsWith(key)) return ACTION_CONFIG[key];
    }
    return { label: log.action_type || "פעולה כללית", icon: Activity, color: "text-slate-600", bg: "bg-slate-500/10" };
  }, [log.action_type, isSuspicious, log.reason]);

  const Icon = config.icon;
  const isError = log.action_type?.includes("FAILED") || log.action_type?.includes("BLOCKED") || isSuspicious;
  
  const browser = log.metadata?.browser || "";
  const ip = log.metadata?.real_ip || log.ip_address;
  const isMobile = /Android|iPhone|iPad/i.test(browser);
  const isWindows = /Windows/i.test(browser);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
      className={cn(
        "group flex flex-col border-b border-border/20 transition-all cursor-pointer overflow-hidden",
        isError 
          ? "bg-red-500/[0.01] hover:bg-red-500/[0.03]" 
          : "bg-card hover:bg-muted/10",
        expanded && "bg-muted/20 border-primary/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Icon (small and sleek) */}
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
            isError ? "bg-red-500/10 text-red-500 border-red-500/20" : cn("bg-background border-border/30", config.color)
          )}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            {/* Col 1: Action Tag & Time */}
            <div className="md:col-span-4 flex items-center gap-2.5">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shrink-0",
                isError ? "bg-red-500/15 border-red-500/30 text-red-500" : "bg-primary/10 border-primary/20 text-primary"
              )}>
                {config.label}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground/80 shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/45" />
                {log.created_at ? format(new Date(log.created_at), "HH:mm, dd/MM/yyyy", { locale: he }) : "זמן לא ידוע"}
              </span>
            </div>

            {/* Col 2: Log Description */}
            <div className="md:col-span-5 min-w-0">
              <p className="text-xs sm:text-sm font-black text-foreground/80 truncate leading-relaxed">
                {log.description}
              </p>
            </div>

            {/* Col 3: Actors (User / Target) */}
            <div className="md:col-span-3 min-w-0 flex flex-wrap items-center gap-1.5">
              {log.user_name && (
                <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1 bg-background/50 border border-border/20 px-2 py-0.5 rounded-lg">
                  <User className="w-3 h-3 text-muted-foreground/55" />
                  <span>בוצע ע״י: <span className="font-black text-foreground/75">{log.user_name}</span></span>
                </span>
              )}
              {log.target_name && (
                <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1 bg-background/50 border border-border/20 px-2 py-0.5 rounded-lg">
                  <ArrowLeftRight className="w-3 h-3 text-muted-foreground/55" />
                  <span>עבור: <span className="font-black text-foreground/75">{log.target_name}</span></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Left-end row metadata */}
        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/10">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-muted-foreground/70">{ip}</span>
            <span className="text-[10px] font-black text-muted-foreground/50 hidden md:inline">
              {isWindows ? "מחשב" : isMobile ? "נייד" : "שרת"}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-background/50 border border-border/20 group-hover:bg-primary/10 transition-colors">
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", expanded && "rotate-180")} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/20 bg-muted/5"
          >
            <div className="px-4 py-3 flex flex-wrap items-center gap-2.5">
              <DetailPill icon={Wifi} label="כתובת IP" value={ip} />
              <DetailPill icon={Clock} label="שעה מדויקת" value={log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "N/A"} />
              <DetailPill icon={Fingerprint} label="מזהה פעולה" value={`#${log.id}`} />
              {log.metadata?.success !== undefined && (
                <DetailPill icon={Activity} label="סטטוס" value={log.metadata.success ? "הצליח ✓" : "נכשל ✗"} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background/60 border border-border/20 min-w-0">
      <div className="p-1.5 rounded-lg bg-muted/60 shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-[11px] font-mono font-bold text-foreground/80 truncate ltr" dir="ltr">{value || "—"}</p>
      </div>
    </div>
  );
}

function TechCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-background/80 p-3 rounded-xl border border-border/20 flex flex-col items-center justify-center text-center gap-1.5 group hover:border-primary/20 transition-all">
      <div className={cn("p-1.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors", color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={cn("text-[10px] font-mono font-black truncate max-w-full", color)}>{value}</p>
      </div>
    </div>
  );
}
