import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/types/employee.types";
import { cn, cleanUnitName } from "@/lib/utils";
import {
  Phone,
  MapPin,
  Cake,
  Mail,
  ExternalLink,
  Gift,
  AlertCircle,
  Network,
  Shield,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { useAuthContext } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";

interface EmployeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

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
    return (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate()
    );
  };

  const isBirthday = checkBirthday();
  const whatsappMessage = isBirthday
    ? `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! מאחלים לך הרבה אושר, בריאות והצלחה בכל!`
    : `היי ${employee.first_name}, `;

  const rawPhone = employee.phone_number
    ? employee.phone_number.replace(/\D/g, "")
    : "";
  const whatsAppPhone = rawPhone.startsWith("0")
    ? "972" + rawPhone.substring(1)
    : rawPhone.startsWith("972")
      ? rawPhone
      : rawPhone
        ? "972" + rawPhone
        : "";

  const hasOrg =
    employee.department_name || employee.section_name || employee.team_name;
  const isCommanderOrAdmin = user?.is_commander || user?.is_admin;
  const initials = employee.is_admin
    ? "💬"
    : `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-xl md:max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
        dir="rtl"
      >
        <DialogDragHandle />

        {/* ─── Header: Clean Profile Identity ─── */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/40 text-right bg-muted/20">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-13 h-13 rounded-full flex items-center justify-center font-bold text-base shadow-2xs border transition-all",
                  employee.is_active
                    ? "bg-muted/90 text-foreground border-border/60"
                    : "bg-muted text-muted-foreground border-border/40 opacity-80",
                )}
              >
                <span>{initials}</span>
              </div>
              {isBirthday && (
                <div
                  title="יום הולדת היום!"
                  className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-xs"
                >
                  <Gift className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Name, Status & Role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                  {employee.first_name} {employee.last_name}
                </DialogTitle>
                {employee.service_type_name && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground border border-border/50 font-medium text-[10px] h-5 rounded-md px-2"
                  >
                    {employee.service_type_name}
                  </Badge>
                )}
                {!employee.is_active && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] font-bold h-5 px-1.5 leading-none bg-destructive/10 text-destructive border-destructive/20"
                  >
                    לא פעיל
                  </Badge>
                )}
              </div>

              {getProfessionalTitle(employee) ? (
                <span className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                  <span>{getProfessionalTitle(employee)}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal mt-0.5 block">
                  שוטר
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ─── Body: Structured Information Cards ─── */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-3.5 custom-scrollbar">
          {/* Card 1: Contact Details */}
          <div className="bg-muted/20 border border-border/40 rounded-xl p-3 space-y-2.5">
            {/* Phone */}
            {employee.phone_number ? (
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-2xs">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                      טלפון
                    </span>
                    <a
                      href={`tel:${employee.phone_number.replace(/\s/g, "")}`}
                      className="text-xs sm:text-sm font-mono font-medium text-foreground hover:text-primary transition-colors truncate"
                      dir="ltr"
                    >
                      {employee.phone_number}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${employee.phone_number.replace(/\s/g, "")}`}
                    title="חייג"
                    className="h-7 px-2.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span className="hidden sm:inline">חייג</span>
                  </a>
                  {whatsAppPhone && (
                    <a
                      href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="פתח שיחה בוואטסאפ"
                      className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>וואטסאפ</span>
                    </a>
                  )}
                </div>
              </div>
            ) : null}

            {/* Email */}
            {employee.email && (
              <div
                className={cn(
                  "flex items-center justify-between gap-3 py-1",
                  employee.phone_number && "border-t border-border/30 pt-2.5",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-2xs">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                      אימייל
                    </span>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(employee.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                      dir="ltr"
                    >
                      {employee.email}
                    </a>
                  </div>
                </div>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(employee.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="פתח ב-Gmail"
                  className="h-7 px-2.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-2xs shrink-0"
                >
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="hidden sm:inline">שלח</span>
                </a>
              </div>
            )}

            {/* City & Birthdate */}
            {(employee.city || employee.birth_date) && (
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
                  (employee.phone_number || employee.email) &&
                    "border-t border-border/30 pt-2.5",
                )}
              >
                {employee.city && (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-2xs">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                        עיר מגורים
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {employee.city}
                      </span>
                    </div>
                  </div>
                )}
                {employee.birth_date && (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-2xs">
                      <Cake className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                        תאריך לידה
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {new Date(employee.birth_date).toLocaleDateString(
                          "he-IL",
                        )}{" "}
                        (גיל {calculateAge(employee.birth_date)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Org Structure */}
          {hasOrg && (
            <div className="bg-muted/20 border border-border/40 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2.5">
                <Network className="w-3.5 h-3.5 text-muted-foreground" />
                <span>שיוך ארגוני</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {employee.department_name && (
                  <div
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected =
                        searchParams.get("dept") === employee.department_name;
                      navigate(
                        isSelected
                          ? "/employees"
                          : `/employees?dept=${encodeURIComponent(employee.department_name || "")}`,
                      );
                      onOpenChange(false);
                    }}
                    title={cleanUnitName(employee.department_name)}
                    className={cn(
                      "flex flex-col p-2.5 sm:p-3 rounded-xl bg-background border border-border/50 text-right transition-all shadow-2xs min-w-0",
                      isCommanderOrAdmin &&
                        "cursor-pointer hover:border-primary/40 hover:bg-muted/30",
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium mb-1 leading-none">
                      מחלקה
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground break-words leading-snug">
                      {cleanUnitName(employee.department_name)}
                    </span>
                  </div>
                )}
                {employee.section_name && (
                  <div
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected =
                        searchParams.get("section") === employee.section_name;
                      navigate(
                        isSelected
                          ? "/employees"
                          : `/employees?section=${encodeURIComponent(employee.section_name || "")}`,
                      );
                      onOpenChange(false);
                    }}
                    title={cleanUnitName(employee.section_name)}
                    className={cn(
                      "flex flex-col p-2.5 sm:p-3 rounded-xl bg-background border border-border/50 text-right transition-all shadow-2xs min-w-0",
                      isCommanderOrAdmin &&
                        "cursor-pointer hover:border-primary/40 hover:bg-muted/30",
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium mb-1 leading-none">
                      מדור
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground break-words leading-snug">
                      {cleanUnitName(employee.section_name)}
                    </span>
                  </div>
                )}
                {employee.team_name && (
                  <div
                    onClick={() => {
                      if (!isCommanderOrAdmin) return;
                      const isSelected =
                        searchParams.get("team") === employee.team_name;
                      navigate(
                        isSelected
                          ? "/employees"
                          : `/employees?team=${encodeURIComponent(employee.team_name || "")}`,
                      );
                      onOpenChange(false);
                    }}
                    title={cleanUnitName(employee.team_name)}
                    className={cn(
                      "flex flex-col p-2.5 sm:p-3 rounded-xl bg-background border border-border/50 text-right transition-all shadow-2xs min-w-0",
                      isCommanderOrAdmin &&
                        "cursor-pointer hover:border-primary/40 hover:bg-muted/30",
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium mb-1 leading-none">
                      צוות / חוליה
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground break-words leading-snug">
                      {cleanUnitName(employee.team_name)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Emergency Contact (if exists) */}
          {ecName && (
            <div className="bg-muted/20 border border-border/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span>איש קשר לחירום</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{ecName}</span>
                  {ecRelation && (
                    <span className="text-muted-foreground">({ecRelation})</span>
                  )}
                </div>
                {ecPhone && (
                  <a
                    href={`tel:${ecPhone.replace(/\s/g, "")}`}
                    className="font-mono text-xs font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    dir="ltr"
                  >
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{ecPhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer: Actions ─── */}
        <div className="px-5 py-3.5 border-t border-border/40 flex flex-col gap-2 bg-muted/10">
          <Button
            variant="default"
            className="w-full h-10 rounded-xl font-semibold text-xs gap-2 shadow-xs cursor-pointer"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onOpenChange(false);
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>צפייה בפרופיל מלא</span>
          </Button>

          <button
            onClick={() =>
              openFeedback(
                `פרופיל שוטר: ${employee.first_name} ${employee.last_name}`,
              )
            }
            className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center py-0.5 cursor-pointer"
          >
            מצאת טעות? יש לך הצעה?{" "}
            <span className="underline underline-offset-4 decoration-muted-foreground/40">
              דווח כאן
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
