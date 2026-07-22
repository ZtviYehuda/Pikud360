import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  Clock,
  ClipboardCheck,
  ArrowLeft,
  Thermometer,
} from "lucide-react";

interface SickEmployee {
  id: number;
  first_name: string;
  last_name: string;
  days_sick: number;
  start_date: string | null;
}

interface SickLeaveDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: SickEmployee[];
}

export const SickLeaveDetailsDialog: React.FC<SickLeaveDetailsDialogProps> = ({
  open,
  onOpenChange,
  employees,
}) => {
  const navigate = useNavigate();

  const handleNavigate = (id: number) => {
    onOpenChange(false);
    navigate(`/employees/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 border-none sm:border sm:border-border bg-card flex flex-col"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600  shrink-0 rotate-3">
              <Thermometer className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1 text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight mb-1">
                שוטרים במחלה ממושכת
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                רשימת המשרתים הנמצאים בימי מחלה מעל 4 ימים ברציפות
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 custom-scrollbar bg-background/50">
          {employees.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-muted-foreground/30 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-black text-lg uppercase tracking-tight">
                אין שוטרים במחלה ממושכת כעת
              </p>
            </div>
          ) : (
            employees.map((emp) => (
              <div
                key={emp.id}
                className="group relative overflow-hidden bg-card border border-border/50 hover:border-red-500/30 hover: hover:-500/5 transition-all rounded-[28px] p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="h-14 w-14 shrink-0 rounded-2xl border border-border/50 flex items-center justify-center bg-muted/30 text-red-700 font-black text-xs group-hover:scale-110 transition-transform ">
                    {emp.first_name?.[0]}
                    {emp.last_name?.[0]}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <h4 className="font-black text-foreground truncate text-base mb-1.5">
                      {emp.first_name} {emp.last_name}
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                      <div className="flex items-center gap-2 text-red-600 font-black bg-red-500/10 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{emp.days_sick} ימים רצופים</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-bold opacity-60 mr-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          מתאריך:{" "}
                          {emp.start_date
                            ? format(new Date(emp.start_date), "dd/MM/yyyy")
                            : "לא ידוע"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-2xl border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => handleNavigate(emp.id)}
                    title="פרופיל אישי"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-11 px-5 rounded-2xl font-black text-xs bg-red-600 hover:bg-red-700 text-white  -500/20 gap-2 transition-all active:scale-95"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/attendance", {
                        state: {
                          openBulkModal: true,
                          missingIds: [emp.id],
                        },
                      });
                    }}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="hidden xs:inline">עדכון סטטוס</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 sm:p-8 bg-muted/20 border-t border-border/50 flex justify-end shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 text-[10px] font-black text-muted-foreground hover:text-foreground hover:bg-background transition-all uppercase tracking-widest gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            סגור חלון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

