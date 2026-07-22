import { useEffect, useState, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import apiClient from "@/config/api.client";
import type { Employee } from "@/types/employee.types";
import {
  Loader2,
  User as UserIcon,
  Phone,
  Calendar,
  BadgeCheck,
  MapPin,
  Mail,
  Cake,
  ArrowRight,
  Save,
  Shield,
  Settings,
  Briefcase,
  Star,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import { format } from "date-fns";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

// ── Shared Component: UnitPicker ──────────────────────────────────────────────
const UnitPicker = ({
  label,
  value,
  options,
  onChange,
  disabled,
  icon: Icon,
}: any) => (
  <div className="flex-1 space-y-1.5">
    <div className="flex items-center gap-1.5 px-1">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
    <Select
      value={value?.toString() || ""}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-background sm:bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all h-12 rounded-xl font-bold px-4">
        <SelectValue placeholder={`בחר ${label}`} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {options.map((opt: any) => (
          <SelectItem key={opt.id} value={opt.id.toString()}>
            {cleanUnitName(opt.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ── Shared Component: Field Display ──────────────────────────────────────────
const Field = ({
  label,
  value,
  mono = false,
  href,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value?: string | null | React.ReactNode;
  mono?: boolean;
  href?: string;
  icon?: any;
  valueClassName?: string;
}) => {
  const hasValue = value !== undefined && value !== null && value !== "";
  if (!hasValue) return null;

  const normalizedHref = href?.trim();
  const safeHref = normalizedHref
    ? normalizedHref.startsWith("mailto:")
      ? `mailto:${normalizedHref.slice(7).trim()}`
      : normalizedHref.startsWith("tel:")
      ? `tel:${normalizedHref.slice(4).trim().replace(/\s+/g, "")}`
      : normalizedHref
    : undefined;

  const isExternalLink =
    safeHref?.startsWith("mailto:") || safeHref?.startsWith("tel:");

  const content = (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-transparent border border-transparent transition-colors hover:border-primary/10">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
      )}
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <span
          className={cn(
            "font-bold text-[15px] mt-0.5",
            safeHref && "text-primary hover:underline",
            mono && "font-mono",
            valueClassName || "text-foreground",
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );

  if (safeHref)
    return (
      <a
        href={safeHref}
        className="block group"
        onClick={(e) => e.stopPropagation()}
        target={isExternalLink ? "_blank" : undefined}
        rel={isExternalLink ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );

  return content;
};

// ── Shared Component: Edit Field Wrapper ─────────────────────────────────────
const EditField = ({
  label,
  children,
  icon: Icon,
  className,
}: {
  label: string;
  children: React.ReactNode;
  icon?: any;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-start gap-4 p-4 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 border border-border/40 transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5",
      className,
    )}
  >
    {Icon && (
      <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
    )}
    <div className="flex-1 flex flex-col justify-center min-w-0">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
        {label}
      </span>
      <div className="relative mt-0.5">{children}</div>
    </div>
  </div>
);

// ── Section Card ──────────────────────────────────────────────────────────────
const Section = ({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) => (
  <div
    className={cn(
      "bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden",
      className,
    )}
  >
    <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <span className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          {title}
        </span>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ── Active Status Popover ───────────────────────────────────────────────────
const ActiveStatusPopover = ({ isActive, onChange, disabled }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isActive
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-rose-500 text-white hover:bg-rose-600",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          title={isActive ? "שוטר פעיל" : "שוטר לא פעיל"}
        >
          <div className={cn("w-2.5 h-2.5 rounded-full bg-white", isActive ? "animate-pulse" : "")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 rounded-2xl border-border/40" dir="rtl">
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
            {isActive 
              ? "השוטר מוגדר כפעיל במערכת. ניתן להעביר אותו למצב לא פעיל במידה וסיים את תפקידו או עבר יחידה." 
              : "השוטר מוגדר כלא פעיל. הוא לא יופיע בדוחות השוטפים ובמצבת כוח האדם הפעילה."}
          </p>
          <Button 
            variant={isActive ? "destructive" : "default"}
            size="sm"
            className="w-full h-9 rounded-xl font-black text-xs"
            onClick={() => {
              onChange(!isActive);
              setOpen(false);
            }}
          >
            {isActive ? "העבר ללא פעיל" : "החזר לפעיל"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ── Tab Button (New Premium Design) ──────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center transition-all relative group h-full rounded-xl",
      active
        ? "text-primary font-black"
        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold",
    )}
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-1 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        initial={false}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      />
    )}
    <div className="relative z-10 flex items-center gap-2">
      {Icon && (
        <Icon
          className={cn(
            "w-4 h-4 transition-all duration-200",
            active
              ? "text-primary scale-110"
              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
          )}
        />
      )}
      <span className="text-xs sm:text-sm tracking-tight leading-none whitespace-nowrap transition-all">
        {label}
      </span>
    </div>
  </button>
);

// ── Mobile Profile Header (Compact) ──────────────────────────────────────────
const MobileProfileHeader = ({
  employee,
  displayName,
  commanderTitle,
  formData,
  editMode,
  handleFieldChange,
}: any) => (
  <div className="flex flex-col items-center text-center p-6 bg-card/40 backdrop-blur-xl rounded-3xl border border-border/40 mb-6 lg:hidden relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

    <div
      className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black border-[4px] border-white dark:border-slate-900 mb-4 relative",
        employee.is_active
          ? "bg-primary text-primary-foreground"
          : "bg-slate-200 text-slate-500",
      )}
    >
      {formData.first_name?.[0]}
      {formData.last_name?.[0]}
      
    </div>

    <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
      {editMode
        ? `${formData.first_name || ""} ${formData.last_name || ""}`
        : displayName}
    </h1>

    <div className="flex flex-wrap items-center justify-center gap-2">
      {commanderTitle && (
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black px-2 py-0.5 rounded-lg">
          <Star className="w-3 h-3 fill-primary ml-1" />
          {commanderTitle}
        </Badge>
      )}
      <Badge
        variant="outline"
        className="border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-lg"
      >
        {employee.service_type_name}
      </Badge>
    </div>
  </div>
);

// ── Action Footer (Sticky for Mobile) ────────────────────────────────────────
const ActionFooter = ({ editMode, onEdit, onSave, onCancel, saving, isActive, onToggleActive }: any) => (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 flex gap-3">
    {editMode ? (
      <>
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-xl h-12 font-black"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}{" "}
          שמור
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl h-12 font-bold bg-white dark:bg-slate-900"
        >
          ביטול
        </Button>
      </>
    ) : (
      <div className="flex gap-2 w-full">
        <Button
          onClick={onEdit}
          className="flex-1 rounded-xl h-12 font-black"
        >
          <Settings className="w-4 h-4 ml-2" /> עריכת פרופיל
        </Button>
        <Button
          variant="outline"
          onClick={onToggleActive}
          className={cn(
            "flex-1 rounded-xl h-12 font-black border transition-all active:scale-[0.98]",
            isActive
              ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
              : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
          )}
        >
          {isActive ? "העבר ללא פעיל" : "החזר לפעיל"}
        </Button>
      </div>
    )}
  </div>
);

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { user } = useAuthContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // personal | pro
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({});
  const [structure, setStructure] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [createdCredentials, setCreatedCredentials] = useState<{name: string, user: string, pass: string} | null>(null);
  const [copiedField, setCopiedField] = useState("");

  const fetchData = async () => {
    if (!id) return;
    try {
      const [{ data: empData }, { data: structData }, { data: serviceData }] =
        await Promise.all([
          apiClient.get<Employee>(
            endpoints.updateEmployeeEndpoint(parseInt(id)),
          ),
          apiClient.get("/employees/structure"),
          apiClient.get("/employees/service-types"),
        ]);
      setEmployee(empData);
      setStructure(structData);
      setServiceTypes(serviceData);

      // Init form
      setFormData(empData);
      setSelectedDeptId(empData.department_id?.toString() || "");
      setSelectedSectionId(empData.section_id?.toString() || "");
    } catch {
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (pathname.includes("/edit/")) {
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  }, [pathname]);

  const sections = useMemo(() => {
    if (!selectedDeptId) return [];
    return (
      structure.find((d) => d.id.toString() === selectedDeptId)?.sections || []
    );
  }, [selectedDeptId, structure]);

  const teams = useMemo(() => {
    if (!selectedSectionId) return [];
    return (
      sections.find((s: any) => s.id.toString() === selectedSectionId)?.teams ||
      []
    );
  }, [selectedSectionId, sections]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!employee) return;
    setSaving(true);
    
    const isNowCmd = formData.is_commander || formData.is_admin;
    const wasCmd = employee.is_commander || employee.is_admin;
    const hasDummyUsername = employee.username?.startsWith('emp_');

    const needsNewCredentials = isNowCmd && (!wasCmd || hasDummyUsername);
    let generatedCreds = null;
    let payload = { ...formData };

    if (needsNewCredentials) {
      generatedCreds = {
        user: Math.floor(100000 + Math.random() * 900000).toString(),
        pass: Math.floor(100000 + Math.random() * 900000).toString()
      };
      payload.username = generatedCreds.user;
      payload.password = generatedCreds.pass;
      payload.must_change_password = true;
    }

    try {
      await apiClient.put(
        endpoints.updateEmployeeEndpoint(parseInt(id!)),
        payload,
      );
      
      if (generatedCreds) {
        setCreatedCredentials({
          name: employee.dominant_name || `${employee.first_name || ''} ${employee.last_name || ''}`,
          user: generatedCreds.user,
          pass: generatedCreds.pass
        });
      } else {
        toast.success("כרטיס שוטר עודכן בהצלחה");
        await fetchData();
        setEditMode(false);
        navigate(`/employees/${id}`); // Back to non-edit URL
      }
    } catch {
      toast.error("שגיאה בעדכון כרטיס שוטר");
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async () => {
    if (!employee) return;
    const nextActive = !employee.is_active;
    const loadingToast = toast.loading(nextActive ? "מחזיר שוטר למצב פעיל..." : "מעביר שוטר למצב לא פעיל...");
    try {
      await apiClient.put(
        endpoints.updateEmployeeEndpoint(employee.id),
        { ...employee, is_active: nextActive }
      );
      toast.success(nextActive ? "השוטר הוחזר למצב פעיל בהצלחה" : "השוטר הועבר למצב לא פעיל", { id: loadingToast });
      await fetchData();
    } catch {
      toast.error("שגיאה בעדכון סטטוס השוטר", { id: loadingToast });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!employee) return null;

  const displayName = employee.dominant_name
    ? `${employee.dominant_name} ${employee.last_name}`
    : `${employee.first_name} ${employee.last_name}`;

  const isBirthdayToday = (() => {
    if (!employee.birth_date) return false;
    const today = new Date();
    const bd = new Date(employee.birth_date);
    return (
      today.getDate() === bd.getDate() && today.getMonth() === bd.getMonth()
    );
  })();

  const commanderTitle = (() => {
    if (!employee.is_commander) return null;
    if (employee.commands_team_id)
      return `מפקד חוליית ${cleanUnitName(employee.team_name)}`;
    if (employee.commands_section_id)
      return `מפקד מדור ${cleanUnitName(employee.section_name)}`;
    if (employee.commands_department_id)
      return `מפקד מחלקת ${cleanUnitName(employee.department_name)}`;
    return "מפקד";
  })();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background" dir="rtl">
      <BirthdayGreetingsModal
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
        targetEmployee={
          employee
            ? {
                id: employee.id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                phone_number: employee.phone_number || "",
                birth_date: employee.birth_date,
                day: employee.birth_date
                  ? new Date(employee.birth_date).getDate()
                  : 1,
                month: employee.birth_date
                  ? new Date(employee.birth_date).getMonth() + 1
                  : 1,
              }
            : undefined
        }
      />

      <Dialog open={!!createdCredentials} onOpenChange={async () => {
        setCreatedCredentials(null);
        await fetchData();
        setEditMode(false);
        navigate(`/employees/${id}`);
      }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 text-right p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="p-6 bg-primary/5 pb-4 border-b border-primary/10">
            <div className="w-12 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-primary mb-1">
              מינוי המפקד הושלם!
            </DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground">
              פרטי הגישה החדשים נוצרו בהצלחה
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="bg-muted/50 rounded-2xl p-5 border border-border/50 space-y-4">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">שם משתמש</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2.5 font-mono text-center font-black text-lg text-foreground tracking-widest select-all">
                    {createdCredentials?.user}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-[46px] w-[46px] rounded-xl border-border/50 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials?.user || "");
                      setCopiedField("user");
                      setTimeout(() => setCopiedField(""), 2000);
                    }}
                  >
                    {copiedField === "user" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">סיסמה זמנית</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2.5 font-mono text-center font-black text-lg text-foreground tracking-widest select-all">
                    {createdCredentials?.pass}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-[46px] w-[46px] rounded-xl border-border/50 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials?.pass || "");
                      setCopiedField("pass");
                      setTimeout(() => setCopiedField(""), 2000);
                    }}
                  >
                    {copiedField === "pass" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-right">
              <div className="p-2 bg-amber-500/10 rounded-xl h-fit">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 leading-tight">דרישת החלפת סיסמה הופעלה</p>
                <p className="text-[10px] font-bold text-amber-600/80 mt-0.5 leading-tight">בחיבורו הראשון של המפקד למערכת, הוא יידרש להחליף סיסמה זו לסיסמה אישית משלו.</p>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-sm font-black rounded-xl"
              onClick={async () => {
                setCreatedCredentials(null);
                await fetchData();
                setEditMode(false);
                navigate(`/employees/${id}`);
              }}
            >
              המשך
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-full mx-auto pt-6 pb-4 px-4 sm:px-6 transition-all pb-32 lg:pb-12">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <ArrowRight className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">חזרה לרשימה</span>
          </button>

          {!editMode && isBirthdayToday && (
            <button
              onClick={() => setShowBirthdayModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-black dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200"
            >
              <Cake className="w-4 h-4" />
              <span className="hidden sm:inline">יום הולדת 🎂</span>
            </button>
          )}
        </div>

        <MobileProfileHeader
          employee={employee}
          displayName={displayName}
          commanderTitle={commanderTitle}
          formData={formData}
          editMode={editMode}
          handleFieldChange={handleFieldChange}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* ── DESKTOP SIDEBAR: PROFILE CARD (HERO) ── */}
          <div className="hidden lg:block lg:w-80 xl:w-[360px] shrink-0 lg:sticky lg:top-24">
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-6 border border-border/40 flex flex-col items-center text-center relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10" />

              <div className="relative group mt-4">
                <div
                  className={cn(
                    "w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-black border-[6px] border-white dark:border-slate-950 ring-1 ring-slate-100 dark:ring-slate-800 transition-all relative",
                    employee.is_active
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-slate-200 text-slate-500 grayscale",
                    editMode &&
                      "ring-primary/40 ring-offset-4 ring-offset-white dark:ring-offset-slate-950 scale-105",
                  )}
                >
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}

                </div>
              </div>

              <div className="mt-5 space-y-1.5 w-full">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editMode
                    ? `${formData.first_name || ""} ${formData.last_name || ""}`
                    : displayName}
                </h1>
                {commanderTitle && (
                  <div className="flex justify-center mt-2">
                    <p className="flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      {commanderTitle}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6" />

              <div className="w-full space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {selectedDeptId && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0"
                    >
                      {cleanUnitName(
                        structure.find(
                          (d) => d.id.toString() === selectedDeptId,
                        )?.name,
                      )}
                    </Badge>
                  )}
                  {selectedSectionId && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0"
                    >
                      {cleanUnitName(
                        sections.find(
                          (s: any) => s.id.toString() === selectedSectionId,
                        )?.name,
                      )}
                    </Badge>
                  )}
                  {formData.team_id && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0"
                    >
                      {cleanUnitName(
                        teams.find((t: any) => t.id === formData.team_id)?.name,
                      )}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-center mt-2">
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-900"
                  >
                    {employee.service_type_name}
                  </Badge>
                </div>
              </div>

              <div className="w-full mt-8 space-y-2">
                {editMode ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={saving}
                      className="w-full rounded-xl font-black h-12"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Save className="w-4 h-4 ml-2" />
                      )}{" "}
                      שמור שינויים
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate(`/employees/${id}`)}
                      className="w-full rounded-xl font-bold h-12 bg-white dark:bg-slate-950"
                    >
                      ביטול
                    </Button>
                  </div>
                ) : (
                  !user?.is_temp_commander && (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/employees/edit/${id}`)}
                        className="w-full h-12 rounded-xl font-black text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-primary transition-all"
                      >
                        <Settings className="w-4 h-4 ml-2" />
                        עריכת פרופיל
                      </Button>
                      <Button
                        variant="outline"
                        onClick={toggleActiveStatus}
                        className={cn(
                          "w-full h-12 rounded-xl font-black text-sm transition-all border",
                          employee.is_active
                            ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
                            : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
                        )}
                      >
                        {employee.is_active ? "העבר ללא פעיל" : "החזר לפעיל"}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="mt-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-1 flex h-12 items-stretch w-full overflow-hidden">
              <TabButton
                active={activeTab === "personal"}
                onClick={() => setActiveTab("personal")}
                icon={UserIcon}
                label="פרטים אישיים"
              />
              <TabButton
                active={activeTab === "pro"}
                onClick={() => setActiveTab("pro")}
                icon={Shield}
                label="מקצועי והרשאות"
              />
            </div>
          </div>

          {/* ── MAIN CONTENT AREA ── */}
          <div className="flex-1 w-full min-w-0">
            {/* Mobile Tab Control — Visible in both modes on small screens */}
            <div className="mb-6 lg:hidden bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-1 flex h-12 items-stretch overflow-x-auto scrollbar-none">
              <TabButton
                active={activeTab === "personal"}
                onClick={() => setActiveTab("personal")}
                icon={UserIcon}
                label="פרטים"
              />
              <TabButton
                active={activeTab === "pro"}
                onClick={() => setActiveTab("pro")}
                icon={Shield}
                label="מקצועי"
              />
            </div>

            <AnimatePresence mode="wait">
              {!editMode ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    {/* PERSONAL TAB SECTION (Mobile Tab or Desktop Always) */}
                    {activeTab === "personal" && (
                    <div
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-6",
                      )}
                    >
                      <Section title="פרטים אישיים">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Field
                              label="שם מלא *"
                              value={`${employee.first_name} ${employee.last_name}`}
                            />
                            <Field label="עיר מגורים" value={employee.city} />
                          </div>
                          {employee.dominant_name && (
                            <Field
                              label="שם תצוגה"
                              value={employee.dominant_name}
                            />
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <Field
                              label="מין"
                              value={
                                employee.gender === "male" ? "גבר" : "אישה"
                              }
                            />
                            <Field
                              label="תאריך לידה"
                              value={
                                employee.birth_date
                                  ? format(
                                      new Date(employee.birth_date),
                                      "dd/MM/yyyy",
                                    )
                                  : null
                              }
                            />
                          </div>
                        </div>
                      </Section>

                      <Section title="פרטי קשר">
                        <div className="grid grid-cols-1 gap-4">
                          <Field
                            label="טלפון נייד"
                            value={employee.phone_number}
                            mono
                            href={`tel:${employee.phone_number}`}
                            icon={Phone}
                          />
                          <Field
                            label="דואר אלקטרוני"
                            value={employee.email}
                            href={`mailto:${employee.email}`}
                            icon={Mail}
                          />
                        </div>
                      </Section>
                    </div>
                    )}

                    {activeTab === "personal" && (
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-6",
                      )}
                    >
                      <Section
                        title="איש קשר לחירום"
                        className="border-rose-100 dark:border-rose-900/30"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field
                            label="שם וקרבה"
                            value={
                              employee.emergency_contact
                                ?.split("-")?.[0]
                                ?.trim() || "-"
                            }
                            icon={UserIcon}
                          />
                          <Field
                            label="טלפון חירום"
                            value={
                              employee.emergency_contact
                                ?.split("-")?.[1]
                                ?.trim() || employee.emergency_contact
                            }
                            icon={Phone}
                            mono
                            href={`tel:${employee.emergency_contact
                              ?.split("-")?.[1]
                              ?.trim() || employee.emergency_contact}`}
                          />
                        </div>
                      </Section>
                    </div>
                    )}

                    {/* PRO TAB SECTION */}
                    {activeTab === "pro" && (
                    <div
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-6",
                      )}
                    >
                      <Section title="הגדרות תפקיד">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="grid grid-cols-1 gap-4">
                            <Field
                              label="רישיון משטרתי"
                              value={employee.police_license ? "✓ אישור" : "✗ לא אושר"}
                              icon={BadgeCheck}
                              valueClassName={employee.police_license ? "text-emerald-600" : "text-slate-500"}
                            />
                            <Field
                              label="סיווג ביטחוני"
                              value={employee.security_clearance ? "✓ אישור" : "✗ לא אושר"}
                              icon={Shield}
                              valueClassName={employee.security_clearance ? "text-emerald-600" : "text-slate-500"}
                            />
                            <Field
                              label="דרגת פיקוד"
                              value={employee.is_commander ? "✓ מפקד" : "שוטר"}
                              icon={Shield}
                              valueClassName={employee.is_commander ? "text-emerald-600" : "text-slate-500"}
                            />
                          </div>
                        </div>
                      </Section>

                      <Section title="שיבוץ וסטטוס">
                        <div className="grid grid-cols-1 gap-4">
                          <Field
                            label="מחלקה"
                            value={cleanUnitName(employee.department_name)}
                            icon={MapPin}
                          />
                          <Field
                            label="מדור"
                            value={cleanUnitName(employee.section_name)}
                            icon={MapPin}
                          />
                          <Field
                            label="חוליה"
                            value={cleanUnitName(employee.team_name)}
                            icon={MapPin}
                          />
                          <Field
                            label="מעמד אירגוני"
                            value={employee.service_type_name}
                            icon={Briefcase}
                          />
                          <Field
                            label="תאריך גיוס"
                            value={
                              employee.enlistment_date
                                ? format(
                                    new Date(employee.enlistment_date),
                                    "dd/MM/yyyy",
                                  )
                                : null
                            }
                            icon={Calendar}
                          />
                          <Field
                            label="שחרור צפוי"
                            value={
                              employee.discharge_date
                                ? format(
                                    new Date(employee.discharge_date),
                                    "dd/MM/yyyy",
                                  )
                                : null
                            }
                            icon={Calendar}
                          />
                        </div>
                      </Section>
                    </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-6 lg:pb-0"
                >
                  {activeTab === "personal" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="פרטים אישיים">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <EditField label="שם פרטי *" icon={UserIcon}>
                                <Input
                                  value={formData.first_name || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "first_name",
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                />
                              </EditField>

                              <EditField label="שם משפחה *" icon={UserIcon}>
                                <Input
                                  value={formData.last_name || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "last_name",
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                />
                              </EditField>

                              <EditField label="עיר מגורים" icon={MapPin}>
                                <Input
                                  value={formData.city || ""}
                                  onChange={(e) =>
                                    handleFieldChange("city", e.target.value)
                                  }
                                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                />
                              </EditField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <EditField label="מין" icon={UserIcon}>
                                <Select
                                  value={formData.gender}
                                  onValueChange={(val) =>
                                    handleFieldChange("gender", val)
                                  }
                                >
                                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 focus:ring-0 font-bold text-[15px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent dir="rtl">
                                    <SelectItem value="male">גבר</SelectItem>
                                    <SelectItem value="female">אישה</SelectItem>
                                  </SelectContent>
                                </Select>
                              </EditField>

                              <EditField label="תאריך לידה" icon={Calendar}>
                                <Input
                                  type="date"
                                  value={
                                    formData.birth_date
                                      ? formData.birth_date.split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "birth_date",
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                />
                              </EditField>
                            </div>
                          </div>
                        </Section>

                        <Section title="פרטי קשר">
                          <div className="grid grid-cols-1 gap-4">
                            <EditField label="טלפון נייד" icon={Phone}>
                              <Input
                                value={formData.phone_number || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "phone_number",
                                    e.target.value,
                                  )
                                }
                                className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                dir="ltr"
                              />
                            </EditField>

                            <EditField label="אימייל" icon={Mail}>
                              <Input
                                value={formData.email || ""}
                                onChange={(e) =>
                                  handleFieldChange("email", e.target.value)
                                }
                                className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                                dir="ltr"
                              />
                            </EditField>
                          </div>
                        </Section>
                      </div>

                      <Section
                        title="איש קשר לחירום"
                        className="border-rose-100 dark:border-rose-900/30"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditField label="שם וקרבה" icon={UserIcon}>
                            <Input
                              value={
                                formData.emergency_contact
                                  ?.split("-")?.[0]
                                  ?.trim() || ""
                              }
                              onChange={(e) => {
                                const [_, phone] = (
                                  formData.emergency_contact || ""
                                )
                                  .split("-")
                                  .map((s: string) => s.trim());
                                handleFieldChange(
                                  "emergency_contact",
                                  `${e.target.value} - ${phone || ""}`,
                                );
                              }}
                              className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                            />
                          </EditField>
                          <EditField label="טלפון חירום" icon={Phone}>
                            <Input
                              value={
                                formData.emergency_contact
                                  ?.split("-")?.[1]
                                  ?.trim() || ""
                              }
                              onChange={(e) => {
                                const [name, _] = (
                                  formData.emergency_contact || ""
                                )
                                  .split("-")
                                  .map((s: string) => s.trim());
                                handleFieldChange(
                                  "emergency_contact",
                                  `${name || ""} - ${e.target.value}`,
                                );
                              }}
                              className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 font-bold text-[15px]"
                              dir="ltr"
                            />
                          </EditField>
                        </div>
                      </Section>
                    </div>
                  )}

                  {activeTab === "pro" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Section title="הגדרות תפקיד">
                        <div className="grid grid-cols-1 gap-8">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-black text-slate-700 dark:text-slate-300 pr-1">
                                מעמד אירגוני
                              </Label>
                              <Select
                                value={formData.service_type_id?.toString()}
                                onValueChange={(val) =>
                                  handleFieldChange(
                                    "service_type_id",
                                    parseInt(val),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {serviceTypes.map((st) => (
                                    <SelectItem
                                      key={st.id}
                                      value={st.id.toString()}
                                    >
                                      {st.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                                  רישיון משטרתי
                                </span>
                              </div>
                              <Switch
                                checked={formData.police_license}
                                onCheckedChange={(val) =>
                                  handleFieldChange("police_license", val)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                                  סיווג ביטחוני
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  אישור גישה למידע מוגן
                                </span>
                              </div>
                              <Switch
                                checked={formData.security_clearance}
                                onCheckedChange={(val) =>
                                  handleFieldChange("security_clearance", val)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                                  דרגת פיקוד
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  סמכות צפייה וניהול שוטרים
                                </span>
                              </div>
                              <Switch
                                checked={formData.is_commander}
                                onCheckedChange={(val) =>
                                  handleFieldChange("is_commander", val)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </Section>

                      <Section title="שיבוץ ארגוני">
                        <div className="grid grid-cols-1 gap-6">
                          {user && (
                            <>
                              <UnitPicker
                                label="מחלקה"
                                value={selectedDeptId}
                                options={structure}
                                onChange={(val: string) => {
                                  setSelectedDeptId(val);
                                  setSelectedSectionId("");
                                  handleFieldChange(
                                    "department_id",
                                    parseInt(val),
                                  );
                                  handleFieldChange("section_id", null);
                                  handleFieldChange("team_id", null);
                                }}
                                disabled={!user.is_admin}
                              />
                              <UnitPicker
                                label="מדור"
                                value={selectedSectionId}
                                options={sections}
                                onChange={(val: string) => {
                                  setSelectedSectionId(val);
                                  handleFieldChange(
                                    "section_id",
                                    parseInt(val),
                                  );
                                  handleFieldChange("team_id", null);
                                }}
                                disabled={
                                  !user.is_admin && !user.commands_department_id
                                }
                              />
                              <UnitPicker
                                label="חוליה"
                                value={formData.team_id}
                                options={teams}
                                onChange={(val: string) =>
                                  handleFieldChange("team_id", parseInt(val))
                                }
                                disabled={
                                  !user.is_admin &&
                                  !user.commands_department_id &&
                                  !user.commands_section_id
                                }
                              />
                            </>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-black text-slate-700 dark:text-slate-300 pr-1">
                                תאריך גיוס
                              </Label>
                              <Input
                                type="date"
                                value={
                                  formData.enlistment_date
                                    ? formData.enlistment_date.split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  handleFieldChange(
                                    "enlistment_date",
                                    e.target.value,
                                  )
                                }
                                className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm font-black text-slate-700 dark:text-slate-300 pr-1">
                                שחרור צפוי
                              </Label>
                              <Input
                                type="date"
                                value={
                                  formData.discharge_date
                                    ? formData.discharge_date.split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  handleFieldChange(
                                    "discharge_date",
                                    e.target.value,
                                  )
                                }
                                className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </Section>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Actions */}
      <ActionFooter
        editMode={editMode}
        onEdit={() => navigate(`/employees/edit/${id}`)}
        onSave={handleSubmit}
        onCancel={() => navigate(`/employees/${id}`)}
        saving={saving}
        isActive={employee.is_active}
        onToggleActive={toggleActiveStatus}
      />
    </div>
  );
}
