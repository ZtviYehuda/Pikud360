import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import type { Employee } from "@/types/employee.types";
import { History, ArrowLeft } from "lucide-react";
import StatusHistoryList from "../StatusHistoryList";
import { Button } from "@/components/ui/button";
import { EmployeeLink } from "@/components/common/EmployeeLink";

interface StatusHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export default function StatusHistoryModal({
  open,
  onOpenChange,
  employee,
}: StatusHistoryModalProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-6 sm:p-8 border-b border-border/50 bg-transparent text-right shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center  shrink-0 rotate-3">
              <History className="w-7 h-7" />
            </div>
            <div className="flex flex-col text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                היסטוריית סטטוסים
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <EmployeeLink
                  employee={employee}
                  className="text-sm font-black text-muted-foreground italic h-auto p-0 hover:no-underline"
                />
                {(employee.is_commander || employee.is_admin) && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] font-bold text-muted-foreground font-mono tracking-widest">
                      {employee.username}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <StatusHistoryList employeeId={employee.id} />
        </div>

        <div className="p-6 bg-transparent border-t border-border/50 flex justify-end shrink-0">
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
}
