import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserPlus,
  Save,
  X,
  User,
  Building2,
  Shield,
  Phone,
  HeartPulse,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  FileCheck,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import type {
  CreateEmployeePayload,
  DepartmentNode,
  ServiceType,
} from "@/types/employee.types";
import { CompactCard } from "@/components/forms/EmployeeFormComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { differenceInYears } from "date-fns";
import { cn, cleanUnitName } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
const InputItem = ({
  label,
  icon: Icon,
  children,
  required,
  className,
}: any) => (
  <div className={cn("space-y-1 sm:space-y-1.5 flex flex-col", className)}>
    <Label className="text-[12px] font-bold text-slate-400 pr-1 flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div className="relative w-full flex flex-col justify-center">
      {children}
    </div>
  </div>
);

const UnitPicker = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  onClear,
}: any) => {
  return (
    <div className="flex-1 min-w-[200px] space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] sm:text-[10px] font-black sm:font-bold text-slate-500 sm:text-slate-400 uppercase tracking-widest flex-1">
          {label}
        </span>
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="text-[9px] font-bold text-primary hover:opacity-70 transition-opacity"
          >
            איפוס
          </button>
        )}
      </div>

      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "h-10 w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl transition-all px-4 hover:border-primary/30 focus:ring-0 text-right font-bold",
            !value && "bg-background border-dashed",
            disabled && "opacity-30 grayscale pointer-events-none",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          dir="rtl"
          className="rounded-xl border-slate-100 dark:border-slate-800 p-1 bg-white dark:bg-slate-950"
        >
          {options.map((opt: any) => (
            <SelectItem
              key={opt.id}
              value={opt.id.toString()}
              className="rounded-lg py-2.5 px-4 font-bold text-slate-700 dark:text-slate-200 focus:bg-slate-50 dark:focus:bg-slate-900 focus:text-primary transition-all cursor-pointer"
            >
              {cleanUnitName(opt.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const SwitchItem = ({
  label,
  checked,
  onCheckedChange,
  icon: Icon,
  description,
}: any) => (
  <div
    className={cn(
      "flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-900 transition-colors",
      checked
        ? "bg-primary/[0.02] border-primary/10"
        : "bg-white dark:bg-slate-950",
    )}
  >
    <div className="flex items-center gap-4">
      {Icon && (
        <Icon
          className={cn(
            "w-5.5 h-5.5 shrink-0",
            checked ? "text-primary" : "text-slate-300",
          )}
        />
      )}
      <div>
        <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">
          {label}
        </p>
        <p className="text-[11px] text-slate-400 font-medium mt-1 truncate max-w-[280px]">
          {description}
        </p>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="scale-90"
    />
  </div>
);
// --- Tab Components ---

const PersonalFormTab = ({
  formData,
  handleFieldChange,
  emergencyDetails,
  setEmergencyDetails,
  relations,
  serviceTypes,
  onNext,
}: any) => {
  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-0">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <User className="w-5 h-5" /> פרטים אישיים
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <InputItem label="שם פרטי" required icon={User}>
            <Input
              value={formData.first_name || ""}
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
              placeholder="פרטי"
       className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 rounded-xl font-bold"
            />
          </InputItem>

          <InputItem label="שם משפחה" required icon={User}>
            <Input
              value={formData.last_name || ""}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
              placeholder="משפחה"
       className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 rounded-xl font-bold"
            />
          </InputItem>

          {(() => {
            const first = (formData.first_name || "").trim();
            const last = (formData.last_name || "").trim();
            const fullName = `${first} ${last}`.trim();
            const words = fullName.split(/\s+/).filter(Boolean);
            const isNameLong = fullName.length > 18 || words.length > 2;

            return (
              <AnimatePresence>
                {(isNameLong || formData.dominant_name) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 10 }}
                    className="col-span-1 md:col-span-2 lg:col-span-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 sm:p-5 mt-2 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                  >
                    <div className="flex items-center gap-3 text-primary">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black">זיהינו שם ארוך מהרגיל</span>
                        <span className="text-xs font-bold opacity-80 mt-0.5">בחר את השם שיוצג ביומיום או הקלד בעצמך:</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
                      {words.map((word, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFieldChange("dominant_name", formData.dominant_name === word ? "" : word)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-black transition-all border",
                            formData.dominant_name === word
                              ? "bg-primary text-white border-primary scale-[1.02]"
                              : "bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:text-primary"
                          )}
                        >
                          {word}
                        </button>
                      ))}
                      
                      <Input
                        value={formData.dominant_name || ""}
                        onChange={(e) => handleFieldChange("dominant_name", e.target.value)}
                        placeholder="הקלד שם אחר..."
                        className="bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 w-[140px] rounded-xl font-bold text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })()}

          <InputItem label="מין" required icon={User}>
            <Select
              value={formData.gender || ""}
              onValueChange={(val) => handleFieldChange("gender", val)}
            >
       <SelectTrigger className="w-full bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 text-right rounded-xl font-bold px-4">
                <SelectValue placeholder="בחר מין" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                <SelectItem value="male" className="font-bold py-2.5">
                  גבר
                </SelectItem>
                <SelectItem value="female" className="font-bold py-2.5">
                  אישה
                </SelectItem>
              </SelectContent>
            </Select>
          </InputItem>

          <InputItem label="תאריך לידה" required icon={Calendar}>
            <Input
              type="date"
              value={
                formData.birth_date ? formData.birth_date.split("T")[0] : ""
              }
              onChange={(e) => handleFieldChange("birth_date", e.target.value)}
       className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 w-full rounded-xl font-bold"
            />
          </InputItem>

          <InputItem label="מעמד" icon={FileCheck}>
            <Select
              value={formData.service_type_id?.toString() || ""}
              onValueChange={(val) =>
                handleFieldChange("service_type_id", parseInt(val))
              }
            >
       <SelectTrigger className="w-full bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 text-right rounded-xl font-bold px-4">
                <SelectValue placeholder="בחר מעמד" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                {serviceTypes.map((st: any) => (
                  <SelectItem
                    key={st.id}
                    value={st.id.toString()}
                    className="font-bold py-2.5"
                  >
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InputItem>

          <InputItem label="עיר מגורים" icon={MapPin}>
            <Input
              value={formData.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="ירושלים, ת''א..."
       className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-10 rounded-xl font-bold"
            />
          </InputItem>
        </div>
      </CompactCard>

      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Phone className="w-5 h-5" /> פרטי קשר וחירום
          </span>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-10">
          {/* Contact Details Block */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-border/40">
              פרטי התקשרות
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <InputItem label="טלפון נייד" icon={Phone} className="sm:col-span-2">
                <Input
                  value={formData.phone_number || ""}
                  onChange={(e) => handleFieldChange("phone_number", e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all h-10 rounded-xl font-bold"
                />
              </InputItem>
              <InputItem label="דואר אלקטרוני" icon={Mail} className="sm:col-span-2">
                <Input
                  value={formData.email || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="example@mail.com"
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all h-10 rounded-xl font-bold"
                />
              </InputItem>
            </div>
          </div>

          {/* Emergency Contact Block (Destructive/Red Theme) */}
          <div className="bg-rose-500/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-rose-500/10 dark:bg-rose-500/[0.02] dark:border-rose-500/10">
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 pb-2 mb-4 border-b border-rose-500/10">
              <HeartPulse className="w-3.5 h-3.5" /> איש קשר לחירום
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 sm:gap-4 w-full">
                <InputItem label="שם מלא (פרטי ומשפחה)" className="sm:col-span-3">
                  <Input
                    value={emergencyDetails.name}
                    onChange={(e) => setEmergencyDetails({ ...emergencyDetails, name: e.target.value })}
                    placeholder="שם איש הקשר"
                    className="h-10 bg-background border border-border/40 focus-visible:ring-rose-500/20 font-bold rounded-xl hover:border-border/80 transition-all"
                  />
                </InputItem>
                <InputItem label="קרבה" className="sm:col-span-2">
                  <Select
                    value={emergencyDetails.relation}
                    onValueChange={(val) => setEmergencyDetails({ ...emergencyDetails, relation: val })}
                  >
                    <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-900/50 border-rose-500/10 text-right font-bold rounded-xl focus:ring-rose-500/20">
                      <SelectValue placeholder="בחר" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="rounded-xl border-rose-500/10">
                      {relations.map((r: string) => (
                        <SelectItem key={r} value={r} className="font-bold py-2.5">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </InputItem>
              </div>
              <InputItem label="טלפון חירום" icon={Phone}>
                <Input
                  value={emergencyDetails.phone}
                  onChange={(e) => setEmergencyDetails({ ...emergencyDetails, phone: e.target.value })}
                  placeholder="מספר טלפון לחירום"
                  className="h-10 bg-white dark:bg-slate-900/50 border-rose-500/10 focus-visible:ring-rose-500/20 font-bold rounded-xl"
                  dir="ltr"
                />
              </InputItem>
            </div>
          </div>
        </div>
      </CompactCard>

      {/* Mobile Navigation Button */}
      <div className="sm:hidden mt-8">
        <Button
          className="w-full h-10 text-lg font-bold  bg-primary text-primary-foreground rounded-2xl"
          onClick={onNext}
        >
          המשך לשלב הבא
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Button>
      </div>
    </div>
  );
};
const ProfessionalFormTab = ({
  formData,
  handleFieldChange,
  structure,
  setSelectedDeptId,
  setSelectedSectionId,
  sections,
  teams,
  user,
  selectedDeptId,
  selectedSectionId,
  onSave,
  saving,
  setFormData,
}: any) => {
  // Admin → full freedom
  // Dept commander → dept is locked (pre-filled), section/team free
  // Section commander → dept+section locked, team free
  // Team commander → all pre-filled and locked
  const isDeptDisabled =
    !user.is_admin &&
    !!(user.commands_department_id || user.commands_section_id || user.commands_team_id);
  const isSectionDisabled =
    !user.is_admin &&
    !!(user.commands_section_id || user.commands_team_id);
  const isTeamDisabled =
    !user.is_admin && !!user.commands_team_id;

  const currentCommander = useMemo(() => {
    if (!formData.is_commander) return null;

    let unitWithCommander = null;
    if (formData.team_id) {
      unitWithCommander = teams.find((t: any) => t.id === formData.team_id);
    } else if (selectedSectionId) {
      unitWithCommander = sections.find(
        (s: any) => s.id === parseInt(selectedSectionId),
      );
    } else if (selectedDeptId) {
      unitWithCommander = structure.find(
        (d: any) => d.id === parseInt(selectedDeptId),
      );
    }

    if (
      unitWithCommander?.commander_id &&
      unitWithCommander.commander_id !== formData.id
    ) {
      return {
        id: unitWithCommander.commander_id,
        name: unitWithCommander.commander_name,
      };
    }
    return null;
  }, [
    formData.is_commander,
    formData.team_id,
    selectedSectionId,
    selectedDeptId,
    structure,
    sections,
    teams,
    formData.id,
  ]);

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      {/* 1. Organizational Affiliation - Compact & Professional */}
      {/* 1. Organizational Affiliation - Compact & Professional */}
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Building2 className="w-5 h-5" /> שיוך יחידתי
          </span>
        }
      >
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          <UnitPicker
            label="מחלקה"
            value={selectedDeptId}
            options={structure}
            onChange={(val: any) => {
              setSelectedDeptId(val);
              setFormData((prev: any) => ({
                ...prev,
                department_id: parseInt(val),
                section_id: undefined,
                team_id: undefined,
              }));
              setSelectedSectionId("");
            }}
            placeholder="בחר מחלקה"
            icon={Building2}
            disabled={isDeptDisabled}
            onClear={() => {
              setSelectedDeptId("");
              setFormData((prev: any) => ({
                ...prev,
                department_id: undefined,
                section_id: undefined,
                team_id: undefined,
              }));
              setSelectedSectionId("");
            }}
          />

          <UnitPicker
            label="מדור"
            value={selectedSectionId}
            options={sections}
            onChange={(val: any) => {
              setSelectedSectionId(val);
              setFormData((prev: any) => ({
                ...prev,
                section_id: parseInt(val),
                team_id: undefined,
              }));
            }}
            placeholder="בחר מדור"
            icon={Briefcase}
            disabled={!selectedDeptId || isSectionDisabled}
            onClear={() => {
              setSelectedSectionId("");
              setFormData((prev: any) => ({
                ...prev,
                section_id: undefined,
                team_id: undefined,
              }));
            }}
          />

          <UnitPicker
            label="חוליה"
            value={formData.team_id?.toString() || ""}
            options={teams}
            onChange={(val: any) => handleFieldChange("team_id", parseInt(val))}
            placeholder="בחר חוליה"
            icon={User}
            disabled={!selectedSectionId || isTeamDisabled}
            onClear={() => handleFieldChange("team_id", undefined)}
          />
        </div>

        {(user?.is_admin || user?.is_commander) && (
          <div className="mt-8 space-y-6 max-w-xl mx-auto border-t pt-6">
            <SwitchItem
              label="מינוי מפקד"
              checked={!!formData.is_commander}
              onCheckedChange={(c: boolean) =>
                handleFieldChange("is_commander", c)
              }
              icon={Shield}
              description="הגדר שוטר זה כמפקד היחידה הארגונית שנבחרה"
            />

            {currentCommander && (
              <div className="flex items-start gap-4 p-5 rounded-[24px] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-black text-amber-900 dark:text-amber-200 leading-tight">
                    שים לב: קיים מפקד פעיל ליחידה זו
                  </p>
                  <p className="text-[11px] font-bold text-amber-600/80 leading-tight">
                    הגדרת שוטר זה כמפקד תבטל את מינויו של{" "}
                    <span className="text-amber-700 dark:text-amber-300 underline decoration-2 underline-offset-2">
                      {currentCommander.name}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CompactCard>

      {/* 2. Professional Details & Permissions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Timeline */}
        <CompactCard
          title={
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <Calendar className="w-5 h-5" /> ציר זמן שירות
            </span>
          }
        >
          <div className="space-y-4">
            <InputItem label="תאריך גיוס" icon={Calendar}>
              <Input
                type="date"
                value={
                  formData.enlistment_date
                    ? formData.enlistment_date.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleFieldChange("enlistment_date", e.target.value)
                }
              />
            </InputItem>
            <InputItem label="כניסה לתפקיד" icon={Calendar}>
              <Input
                type="date"
                value={
                  formData.assignment_date
                    ? formData.assignment_date.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleFieldChange("assignment_date", e.target.value)
                }
              />
            </InputItem>
            <InputItem label="שחרור צפוי (תש''ש)" icon={Calendar}>
              <Input
                type="date"
                value={
                  formData.discharge_date
                    ? formData.discharge_date.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleFieldChange("discharge_date", e.target.value)
                }
              />
            </InputItem>
          </div>
        </CompactCard>

        {/* Permissions & Badges */}
        <CompactCard
          title={
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <Shield className="w-5 h-5" /> הרשאות ואישורים
            </span>
          }
        >
          <div className="space-y-3">
            <SwitchItem
              label="סיווג ביטחוני"
              checked={!!formData.security_clearance}
              onChange={(c: boolean) =>
                handleFieldChange("security_clearance", c)
              }
            />
            <SwitchItem
              label="רישיון נהיגה משטרתי"
              checked={!!formData.police_license}
              onChange={(c: boolean) => handleFieldChange("police_license", c)}
            />
          </div>
        </CompactCard>
      </div>

      {/* Mobile Save Button */}
      <div className="sm:hidden mt-8">
        <Button
          className="w-full h-10 text-xl font-black  bg-primary text-primary-foreground"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6 mr-2" />
          )}
          {saving ? "שומר..." : "שמור שוטר"}
        </Button>
      </div>
    </div>
  );
};

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createEmployee, getStructure } = useEmployees();
  // Note: updateEmployee is unused but kept if needed by hook signature, usually not needed for create page

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [formData, setFormData] = useState<Partial<CreateEmployeePayload>>({
    is_active: true,
  });

  const [emergencyDetails, setEmergencyDetails] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const [activeTab, setActiveTab] = useState("personal");
  const [createdCredentials, setCreatedCredentials] = useState<{name: string, user: string, pass: string} | null>(null);
  const [copiedField, setCopiedField] = useState("");

  const relations = [
    "בן / בת זוג",
    "אבא / אמא",
    "אח / אחות",
    "בן / בת",
    "סבא / סבתא",
    "חבר / חברה",
    "אחר",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [structResp, serviceResp] = await Promise.all([
          getStructure(),
          apiClient.get(endpoints.EMPLOYEES_SERVICE_TYPES_ENDPOINT),
        ]);
        if (structResp) setStructure(structResp);
        if (serviceResp?.data) setServiceTypes(serviceResp.data);

        // Pre-fill user's dept if restricted
        if (user && !user.is_admin) {
          let deptId = user.commands_department_id;
          let sectId = user.commands_section_id;
          let teamId = user.commands_team_id;

          // Trace parent units from structure if only lower level is commanded
          if (structResp) {
            const structure = structResp as DepartmentNode[];

            // If Team Commander, find Section and Department
            if (teamId && !sectId) {
              structure.forEach((d) => {
                d.sections?.forEach((s) => {
                  if (s.teams?.some((t) => t.id === teamId)) {
                    sectId = s.id;
                    deptId = d.id;
                  }
                });
              });
            }
            // If Section Commander, find Department
            else if (sectId && !deptId) {
              const dept = structure.find((d) =>
                d.sections?.some((s) => s.id === sectId),
              );
              if (dept) deptId = dept.id;
            }
          }

          // Fallback to belonging unit if still not found but is commander
          if (!deptId && user.is_commander) deptId = user.department_id;
          if (!sectId && user.is_commander) sectId = user.section_id;

          if (deptId) {
            setSelectedDeptId(deptId.toString());
            setFormData((prev) => ({ ...prev, department_id: deptId }));
          }
          if (sectId) {
            setSelectedSectionId(sectId.toString());
            setFormData((prev) => ({ ...prev, section_id: sectId }));
          }
          if (teamId) {
            setFormData((prev) => ({ ...prev, team_id: teamId }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("שגיאה בטעינת נתונים");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getStructure, user]);

  useEffect(() => {
    const { name, relation, phone } = emergencyDetails;
    if (name || relation || phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contact: `${name} (${relation}) - ${phone}`,
      }));
    }
  }, [emergencyDetails]);

  const handleSubmit = async () => {
    setSaving(true);
    if (!formData.birth_date) {
      toast.error("יש להזין תאריך לידה");
      setSaving(false);
      return;
    }

    // Validation for organizational affiliation
    if (formData.is_commander) {
      if (!selectedDeptId) {
        toast.error("יש לבחור לפחות מחלקה עבור מפקד");
        setSaving(false);
        return;
      }
    } else {
      // Not a commander - full affiliation required
      if (!selectedDeptId || !selectedSectionId || !formData.team_id) {
        toast.error(
          "עבור שוטר שאינו מפקד, יש להזין שיוך ארגוני מלא (מחלקה, מדור וחוליה)",
        );
        setSaving(false);
        return;
      }
    }
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    if (age < 17) {
      toast.error("גיל השוטר חייב להיות 17 ומעלה");
      setSaving(false);
      return;
    }

    if (!formData.gender) {
      toast.error("יש לבחור מין");
      setSaving(false);
      return;
    }

    const payload = { ...formData } as CreateEmployeePayload;
    
    let generatedCreds = null;
    const isCmd = payload.is_commander || payload.is_admin;
    
    if (isCmd && !payload.username) {
      generatedCreds = {
        user: Math.floor(100000 + Math.random() * 900000).toString(),
        pass: Math.floor(100000 + Math.random() * 900000).toString()
      };
      payload.username = generatedCreds.user;
      payload.password = generatedCreds.pass;
      (payload as any).must_change_password = true;
    } else if (!payload.username) {
      payload.username = 'emp_' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900).toString();
    }

    const success = await createEmployee(payload);
    setSaving(false);

    if (success) {
      if (generatedCreds) {
        setCreatedCredentials({
          name: formData.dominant_name || `${formData.first_name || ''} ${formData.last_name || ''}`,
          user: generatedCreds.user,
          pass: generatedCreds.pass
        });
      } else {
        toast.success("השוטר נוצר בהצלחה");
        navigate("/employees");
      }
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const sections =
    structure.find((d) => d.id.toString() === selectedDeptId)?.sections || [];
  const teams =
    sections.find((s) => s.id.toString() === selectedSectionId)?.teams || [];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const TabButton = ({ active, onClick, icon: Icon, label, small }: any) => (
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
              "transition-all duration-200 shrink-0",
              small ? "w-3.5 h-3.5" : "w-4 h-4",
              active
                ? "text-primary scale-110"
                : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            )}
          />
        )}
        <span className={cn(
          "font-black tracking-tight leading-none whitespace-nowrap transition-all",
          small ? "text-[10px] sm:text-[11px]" : "text-sm",
          active ? "opacity-100" : "opacity-75 group-hover:opacity-100"
        )}>
          {label}
        </span>
      </div>
    </button>
  );



  return (
    <div id="create-page-root" className="flex flex-col pb-10">
      {/* Page Header - matches system layout */}
      <div className="pt-4 pb-3 px-4 sm:px-6 shrink-0 flex items-center justify-between gap-3 sm:gap-4 border-b border-border/40 mb-4 sm:mb-6">
        <PageHeader
          icon={UserPlus}
          title="הוספת שוטר חדש"
          className="mb-0"
          hideMobile={true}
        />

        {/* Inline Header Tabs */}
        <div className="hidden sm:flex items-stretch bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-0.5 min-w-[280px] h-10 relative">
          <TabButton
            active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
            icon={User}
            label="פרטים אישיים"
            small
          />
          <TabButton
            active={activeTab === "professional"}
            onClick={() => setActiveTab("professional")}
            icon={Shield}
            label="מקצועי והרשאות"
            small
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            onClick={() => navigate("/employees")}
            className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4 ml-1" />
            <span className="text-xs sm:text-sm">ביטול</span>
          </Button>
          <Button
            className="h-8.5 sm:h-9 px-3.5 sm:px-6 rounded-xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all gap-1.5 sm:gap-2"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="text-xs sm:text-sm whitespace-nowrap">שמור שוטר</span>
          </Button>
        </div>
      </div>

      {/* Mobile-only tabs (original style) */}
      <div className="flex sm:hidden justify-center w-full mb-4 px-4 pt-0">
        <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-0.5 flex w-full h-9">
          <TabButton
            active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
            icon={User}
            label="פרטים אישיים"
            small
          />
          <TabButton
            active={activeTab === "professional"}
            onClick={() => setActiveTab("professional")}
            icon={Shield}
            label="מקצועי והרשאות"
            small
          />
        </div>
      </div>

        <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <PersonalFormTab
                formData={formData}
                handleFieldChange={handleFieldChange}
                emergencyDetails={emergencyDetails}
                setEmergencyDetails={setEmergencyDetails}
                relations={relations}
                serviceTypes={serviceTypes}
                onNext={() => setActiveTab("professional")}
              />
            </motion.div>
          )}
          {activeTab === "professional" && (
            <motion.div
              key="professional"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <ProfessionalFormTab
                formData={formData}
                handleFieldChange={handleFieldChange}
                structure={structure}
                selectedDeptId={selectedDeptId}
                setSelectedDeptId={setSelectedDeptId}
                selectedSectionId={selectedSectionId}
                setSelectedSectionId={setSelectedSectionId}
                sections={sections}
                teams={teams}
                user={user}
                onSave={handleSubmit}
                saving={saving}
                setFormData={setFormData}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

      <Dialog open={!!createdCredentials} onOpenChange={() => { navigate("/employees"); }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 text-right p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="p-6 bg-primary/5 pb-4 border-b border-primary/10">
            <div className="w-12 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-primary mb-1">
              בניית כרטיס הושלמה!
            </DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground">
              פרטי הגישה נוצרו בהצלחה
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
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">סיסמה ראשונית</Label>
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

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={() => {
                  const text = encodeURIComponent(`אהלן ${createdCredentials?.name},\nנוצר לך חשבון חדש למערכת כוח האדם.\n\nשם משתמש: ${createdCredentials?.user}\nסיסמה: ${createdCredentials?.pass}\n\n* בחיבור הראשון המערכת תדרוש ממך להחליף סיסמה.`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                  navigate("/employees");
                }}
                className="w-full h-10 rounded-xl text-base font-black bg-[#25D366] hover:bg-[#128C7E] text-white  transition-all gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                שתף פרטים בוואטסאפ
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/employees")}
                className="w-full h-10 rounded-xl font-bold text-muted-foreground hover:bg-muted"
              >
                סגור וחזור לרשימה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

