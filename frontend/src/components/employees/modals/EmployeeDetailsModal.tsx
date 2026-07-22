import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types/employee.types";
import { cn, cleanUnitName } from "@/lib/utils";
import {
  Phone,
  MapPin,
  Cake,
  User,
  Mail,
  ExternalLink,
  Gift,
  Star,
  AlertCircle,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useAuthContext } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";

interface EmployeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

/** A horizontal info row: icon + label on the right, value on the left */
const InfoRow = ({
  icon: Icon,
  label,
  value,
  type,
  action,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  type?: "phone" | "email";
  action?: React.ReactNode;
}) => {
  if (!value || value === "---") return null;
  const cleanValue = typeof value === "string" ? value.trim() : value;

  const inner = (
    <div className="flex items-center justify-between gap-3 py-3 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
            {label}
          </p>
          <p
            className={cn(
              "text-sm font-black leading-snug truncate",
              type ? "text-primary" : "text-foreground"
            )}
          >
            {cleanValue}
          </p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );

  if (type === "phone" && typeof cleanValue === "string") {
    return <a href={`tel:${cleanValue.replace(/\s/g, "")}`}>{inner}</a>;
  }
  if (type === "email" && typeof cleanValue === "string") {
    return (
      <button
        type="button"
        className="w-full text-right"
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = `mailto:${cleanValue}`;
        }}
      >
        {inner}
      </button>
    );
  }

  return inner;
};

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openFeedback } = useFeedback();
  const [searchParams] = useSearchParams();

  if (!employee) return null;

  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.commands_team_id || emp.team_name) return "מפקד חוליה";
      if (emp.commands_section_id || emp.section_name) return "ראש מדור";
      if (emp.commands_department_id || emp.department_name) return "ראש מחלקה";
      return "מפקד יחידה";
    }
    return null;
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Parse emergency contact
  const contactString = employee.emergency_contact || "";
  const contactParts = contactString.match(/^(.*) \((.*)\) - (.*)$/);
  let ecName = contactString;
  let ecRelation = "";
  let ecPhone = "";
  if (contactParts) {
    [, ecName, ecRelation, ecPhone] = contactParts;
  } else if (!contactString) {
    ecName = "";
  }

  const checkBirthday = () => {
    if (!employee.birth_date) return false;
    const today = new Date();
    const birthDate = new Date(employee.birth_date);
    return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
  };

  const isBirthday = checkBirthday();
  const whatsappMessage = isBirthday
    ? `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! מאחלים לך הרבה אושר, בריאות והצלחה בכל!`
    : `היי ${employee.first_name}, `;

  const hasOrg = employee.department_name || employee.section_name || employee.team_name;
  const isCommanderOrAdmin = user?.is_commander || user?.is_admin;
  const initials = employee.is_admin ? "💬" : `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        dir="rtl"
      >
        <DialogDragHandle />
        {/* ─── Header ─── */}
        <DialogHeader className="px-6 pt-8 pb-5 text-center bg-card">
          <div className="flex flex-col items-center gap-3">
            {/* Avatar circle */}
            <div className="relative">
              <div
                className="w-[68px] h-[68px] rounded-full bg-primary/8 flex items-center justify-center text-[22px] font-black tracking-tight"
                style={{ color: employee.status_color || "var(--primary)" }}
              >
                {initials}
              </div>
              {isBirthday && (
                <div className="absolute -top-1 -right-1 bg-pink-500 text-white p-1.5 rounded-full animate-bounce shadow-md">
                  <Gift className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col items-center gap-1.5">
              <DialogTitle className="text-[22px] font-black text-foreground tracking-tight leading-tight">
                {employee.first_name} {employee.last_name}
              </DialogTitle>

              <div className="flex flex-wrap justify-center gap-1.5">
                {employee.service_type_name && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground border-0 font-bold text-[10px] h-5 rounded-full px-3 uppercase tracking-wide"
                  >
                    {employee.service_type_name}
                  </Badge>
                )}
                {getProfessionalTitle(employee) && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/8 text-primary border-0 font-bold text-[10px] h-5 rounded-full px-3 uppercase tracking-wide flex items-center gap-1"
                  >
                    <Star className="w-2.5 h-2.5" />
                    {getProfessionalTitle(employee)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ─── Body ─── */}
        <div className="px-6 pb-2 max-h-[55vh] overflow-y-auto no-scrollbar">

          {/* Contact info — vertical list */}
          <div className="divide-y divide-border/30">
            {employee.phone_number && (
              <InfoRow
                icon={Phone}
                label="טלפון"
                value={employee.phone_number}
                type="phone"
                action={
                  <WhatsAppButton
                    phoneNumber={employee.phone_number}
                    message={whatsappMessage}
                    title={isBirthday ? "מזל טוב" : ""}
                    className="h-8 w-8 p-0 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                  />
                }
              />
            )}

            {employee.email && (
              <InfoRow icon={Mail} label="אימייל" value={employee.email} type="email" />
            )}

            <InfoRow icon={MapPin} label="עיר" value={employee.city} />

            {employee.birth_date && (
              <InfoRow
                icon={Cake}
                label="תאריך לידה"
                value={`${new Date(employee.birth_date).toLocaleDateString("he-IL")}  ·  גיל ${calculateAge(employee.birth_date)}`}
              />
            )}
          </div>

          {/* Emergency contact */}
          {ecName && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                <AlertCircle className="w-3 h-3 opacity-60" />
                איש קשר לחירום
              </p>
              <div className="divide-y divide-border/30">
                <InfoRow icon={User} label="שם" value={ecName} />
                {ecRelation && <InfoRow icon={User} label="קרבה" value={ecRelation} />}
                {ecPhone && <InfoRow icon={Phone} label="טלפון" value={ecPhone} type="phone" />}
              </div>
            </div>
          )}

          {/* Org structure — vertical list */}
          {hasOrg && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                <Network className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />
                מבנה ארגוני
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {employee.department_name && (
                  <button
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected = searchParams.get("dept") === employee.department_name;
                      navigate(isSelected ? "/employees" : `/employees?dept=${encodeURIComponent(employee.department_name || "")}`);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex flex-col text-right w-full py-2 px-1 transition-all rounded-xl",
                      isCommanderOrAdmin && "cursor-pointer hover:bg-primary/5 active:scale-[0.98]",
                      searchParams.get("dept") === employee.department_name && "bg-primary/5 ring-1 ring-primary/20"
                    )}
                  >
                    <span className="text-[11px] text-[#8E8E93] font-normal mb-1 leading-none">מחלקה</span>
                    <span className="text-[14px] text-[#1C1C1E] dark:text-foreground font-bold leading-tight line-clamp-2">{cleanUnitName(employee.department_name)}</span>
                  </button>
                )}
                {employee.section_name && (
                  <button
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected = searchParams.get("section") === employee.section_name;
                      navigate(isSelected ? "/employees" : `/employees?section=${encodeURIComponent(employee.section_name || "")}`);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex flex-col text-right w-full py-2 px-1 transition-all rounded-xl",
                      isCommanderOrAdmin && "cursor-pointer hover:bg-primary/5 active:scale-[0.98]",
                      searchParams.get("section") === employee.section_name && "bg-primary/5 ring-1 ring-primary/20"
                    )}
                  >
                    <span className="text-[11px] text-[#8E8E93] font-normal mb-1 leading-none">מדור</span>
                    <span className="text-[14px] text-[#1C1C1E] dark:text-foreground font-bold leading-tight line-clamp-2">{cleanUnitName(employee.section_name)}</span>
                  </button>
                )}
                {employee.team_name && (
                  <button
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected = searchParams.get("team") === employee.team_name;
                      navigate(isSelected ? "/employees" : `/employees?team=${encodeURIComponent(employee.team_name || "")}`);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex flex-col text-right w-full py-2 px-1 transition-all rounded-xl",
                      isCommanderOrAdmin && "cursor-pointer hover:bg-primary/5 active:scale-[0.98]",
                      searchParams.get("team") === employee.team_name && "bg-primary/5 ring-1 ring-primary/20"
                    )}
                  >
                    <span className="text-[11px] text-[#8E8E93] font-normal mb-1 leading-none">צוות</span>
                    <span className="text-[14px] text-[#1C1C1E] dark:text-foreground font-bold leading-tight line-clamp-2">{cleanUnitName(employee.team_name)}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-5 py-4 border-t border-border/30 flex flex-col gap-3">
          <Button
            variant="default"
            className="w-full gap-2 font-black bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-2xl transition-all active:scale-[0.98] text-sm shadow-lg shadow-primary/20"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onOpenChange(false);
            }}
          >
            <ExternalLink className="w-4 h-4" />
            צפייה בפרופיל מלא
          </Button>

          {/* Contextual Feedback Link */}
          <button
            onClick={() => openFeedback(`פרופיל שוטר: ${employee.first_name} ${employee.last_name}`)}
            className="w-full text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors text-center py-1"
          >
            מצאת טעות? יש לך הצעה לדף זה? <span className="underline decoration-primary/30 underline-offset-4">לחץ כאן</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
