import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, cleanUnitName, isValidIsraeliPhone } from "@/lib/utils";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import { generateUniqueUsername } from "@/utils/usernameGenerator";
import type { DepartmentNode, ServiceType, CreateEmployeePayload } from "@/types/employee.types";

interface ImportEmployeesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedEmployeeRow {
  firstName: string;
  lastName: string;
  personalId: string;
  phone: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  departmentName?: string;
  sectionName?: string;
  teamName?: string;
  serviceTypeName?: string;
  position?: string;
  isCommander?: boolean;
}

export const ImportEmployeesModal: React.FC<ImportEmployeesModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  useEffect(() => {
    if (open) {
      // Load structure & service types for mapping names to IDs
      apiClient.get(endpoints.EMPLOYEES_STRUCTURE_ENDPOINT).then((res) => {
        if (res?.data) setStructure(res.data);
      }).catch(() => {});

      apiClient.get(endpoints.EMPLOYEES_SERVICE_TYPES_ENDPOINT).then((res) => {
        if (res?.data) setServiceTypes(res.data);
      }).catch(() => {});
    } else {
      // Reset state when closing
      setSelectedFile(null);
      setParsedRows([]);
      setValidationErrors([]);
      setUploadProgress(null);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error("קובץ לא נתמך. יש להעלות קובץ Excel (.xlsx / .xls) או CSV בלבד.");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setValidationErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!jsonRows || jsonRows.length === 0) {
        toast.error("הקובץ ריק או שאינו מכיל שורות נתונים");
        setParsedRows([]);
        return;
      }

      const rows: ParsedEmployeeRow[] = [];
      const errors: string[] = [];

      jsonRows.forEach((row, index) => {
        const rowNum = index + 2; // header is row 1

        // Normalize keys (trim whitespace and lowercase)
        const normalized: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = String(row[key] ?? "").trim();
        });

        // Helper to find value from possible header synonyms
        const getVal = (...keys: string[]) => {
          for (const k of keys) {
            if (normalized[k.toLowerCase()]) return normalized[k.toLowerCase()];
          }
          return "";
        };

        const firstName = getVal("שם פרטי", "first_name", "firstname", "שם");
        const lastName = getVal("שם משפחה", "last_name", "lastname", "משפחה");
        const personalId = getVal("תעודת זהות", "ת.ז.", "ת.ז", "מספר אישי", "מ.א.", "מ.א", "id", "personal_id", "tz", "employee_number");
        const phone = getVal("טלפון", "טלפון נייד", "נייד", "סלולרי", "phone", "phone_number", "mobile");
        const email = getVal("דוא\"ל", "דואל", "אימייל", "מייל", "email", "mail");
        const gender = getVal("מין", "gender", "sex");
        const birthDate = getVal("תאריך לידה", "birth_date", "birthdate", "ת.לידה");
        const departmentName = getVal("מחלקה", "department", "dept");
        const sectionName = getVal("מדור", "section");
        const teamName = getVal("חוליה", "צוות", "team");
        const serviceTypeName = getVal("מעמד ארגוני", "סוג שירות", "מעמד", "service_type");
        const position = getVal("תפקיד", "position", "role");
        const isCommanderStr = getVal("מפקד", "is_commander", "commander");

        if (!firstName || !lastName) {
          errors.push(`שורה ${rowNum}: חסר שם פרטי או שם משפחה`);
          return;
        }

        let formattedPhone = phone;
        if (formattedPhone) {
          // Normalize 05... phone
          formattedPhone = formattedPhone.replace(/[^\d+]/g, "");
          if (formattedPhone.startsWith("972")) formattedPhone = "0" + formattedPhone.slice(3);
          if (formattedPhone.startsWith("+972")) formattedPhone = "0" + formattedPhone.slice(4);
        }

        rows.push({
          firstName,
          lastName,
          personalId: personalId || `emp_${Date.now()}_${index}`,
          phone: formattedPhone || "0500000000",
          email: email || undefined,
          gender: gender === "גבר" || gender === "זכר" || gender === "male" ? "male" : "female",
          birthDate: birthDate || "1995-01-01",
          departmentName: departmentName || undefined,
          sectionName: sectionName || undefined,
          teamName: teamName || undefined,
          serviceTypeName: serviceTypeName || "קבע",
          position: position || "שוטר",
          isCommander: isCommanderStr === "כן" || isCommanderStr === "true" || isCommanderStr === "1",
        });
      });

      setParsedRows(rows);
      setValidationErrors(errors);

      if (rows.length > 0) {
        toast.success(`נמצאו ${rows.length} רשומות תקינות בקובץ`);
      } else {
        toast.error("לא נמצאו רשומות תקינות בקובץ. ודא שהעמודות תואמות לתבנית.");
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      toast.error("שגיאה בפענוח הקובץ. ודא שהקובץ תקין ואינו נעול.");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "שם פרטי,שם משפחה,תעודת זהות,טלפון,דוא\"ל,מחלקה,מדור,חוליה,מעמד ארגוני,תפקיד\n" +
      "ישראל,ישראלי,012345678,0501234567,israel@police.gov.il,מטה,מבצעים,סיור,קבע,שוטר סיור\n" +
      "שרה,כהן,098765432,0529876543,sara@police.gov.il,מטה,חקירות,,סדיר,חוקרת";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "תבנית_ייבוא_שוטרים.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("תבנית לדוגמה הורדה בהצלחה");
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) {
      toast.error("אין רשומות לייבוא");
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    const failErrors: string[] = [];

    // Fetch existing employees to avoid duplicate usernames
    let existingUsernames: string[] = [];
    try {
      const { data: emps } = await apiClient.get<any[]>("/employees");
      if (Array.isArray(emps)) {
        existingUsernames = emps.map((e) => e.username || e.user_name || "").filter(Boolean);
      }
    } catch (e) {
      // ignore
    }

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      setUploadProgress({ current: i + 1, total: parsedRows.length });

      try {
        // Map department, section, team to IDs
        let deptId: number | undefined;
        let sectId: number | undefined;
        let teamId: number | undefined;

        if (row.departmentName && structure.length > 0) {
          const cleanDept = cleanUnitName(row.departmentName).trim().toLowerCase();
          const dept = structure.find((d) => cleanUnitName(d.name).trim().toLowerCase() === cleanDept);
          if (dept) {
            deptId = dept.id;
            if (row.sectionName && dept.sections) {
              const cleanSect = cleanUnitName(row.sectionName).trim().toLowerCase();
              const sect = dept.sections.find((s) => cleanUnitName(s.name).trim().toLowerCase() === cleanSect);
              if (sect) {
                sectId = sect.id;
                if (row.teamName && sect.teams) {
                  const cleanTm = cleanUnitName(row.teamName).trim().toLowerCase();
                  const tm = sect.teams.find((t) => cleanUnitName(t.name).trim().toLowerCase() === cleanTm);
                  if (tm) teamId = tm.id;
                }
              }
            }
          }
        }

        // Map service type
        let serviceTypeId: number | undefined;
        if (row.serviceTypeName && serviceTypes.length > 0) {
          const st = serviceTypes.find((s) => s.name.trim().toLowerCase() === row.serviceTypeName?.trim().toLowerCase());
          if (st) serviceTypeId = st.id;
        }

        const username = generateUniqueUsername(row.firstName, row.lastName, existingUsernames);
        existingUsernames.push(username);

        const payload: Partial<CreateEmployeePayload> = {
          first_name: row.firstName,
          last_name: row.lastName,
          dominant_name: `${row.firstName} ${row.lastName}`,
          phone_number: row.phone,
          email: row.email,
          gender: row.gender as any,
          birth_date: row.birthDate,
          department_id: deptId,
          section_id: sectId,
          team_id: teamId,
          service_type_id: serviceTypeId,
          position: row.position || "שוטר",
          is_commander: row.isCommander || false,
          is_active: true,
          username,
        };

        await apiClient.post("/employees", payload);
        successCount++;
      } catch (err: any) {
        failCount++;
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || "שגיאה לא ידועה";
        failErrors.push(`${row.firstName} ${row.lastName}: ${msg}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      toast.success(`${successCount} שוטרים נוספו בהצלחה למערכת!`);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }

    if (failCount > 0) {
      toast.error(`${failCount} רשומות נכשלו בייבוא:\n${failErrors.slice(0, 3).join("\n")}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-5 sm:p-6 rounded-[2rem] border border-border/50 shadow-2xl bg-card max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader className="text-right space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                ייבוא שוטרים מקובץ
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground mt-0.5">
                העלאת קובץ Excel או CSV להזנה מהירה של שוטרים למערכת
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Instructions Box */}
        <div className="space-y-3 py-1">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 space-y-2.5 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                מבנה הקובץ הנדרש
              </span>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                הורד תבנית לדוגמה
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-background/80 border border-border/30">
                <p className="font-black text-slate-800 dark:text-slate-200 text-[11px] mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  עמודות חובה:
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  שם פרטי, שם משפחה, תעודת זהות, טלפון
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-background/80 border border-border/30">
                <p className="font-black text-slate-800 dark:text-slate-200 text-[11px] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  עמודות רשות:
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  דוא"ל, מחלקה, מדור, חוליה, מעמד, תפקיד
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium pr-1">
              • פורמטים נתמכים: <strong>Excel (.xlsx, .xls)</strong> או <strong>CSV (.csv)</strong>
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />

            {isParsing ? (
              <div className="flex items-center gap-2 py-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs font-bold">מפענח קובץ...</span>
              </div>
            ) : selectedFile ? (
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xs font-black text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {parsedRows.length} שוטרים זוהו
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setParsedRows([]);
                    setValidationErrors([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">
                    לחץ לבחירת קובץ או גרור לכאן
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                    Excel (.xlsx, .xls) או CSV
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                הערות לתשומת לב ({validationErrors.length}):
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pr-2">
                {validationErrors.slice(0, 3).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Uploading progress bar */}
          {uploadProgress && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black text-primary">
                <span>מייבא נתונים למערכת...</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200 rounded-full"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="h-10 px-4 rounded-xl text-xs font-bold text-muted-foreground"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={parsedRows.length === 0 || isUploading}
            className="h-10 px-5 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>
              {isUploading
                ? `מעלה (${uploadProgress?.current || 0}/${uploadProgress?.total || 0})...`
                : `ייבא ${parsedRows.length > 0 ? `${parsedRows.length} שוטרים` : ""}`}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
