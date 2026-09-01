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
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/20 text-right shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col text-right space-y-0.5">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                היסטוריית סטטוסים
              </DialogTitle>
              <div className="flex items-center gap-2">
                <EmployeeLink
                  employee={employee}
                  className="text-xs font-medium text-muted-foreground h-auto p-0 hover:no-underline"
                />
                {(employee.is_commander || employee.is_admin) && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] font-medium text-muted-foreground font-mono">
                      {employee.username}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <StatusHistoryList employeeId={employee.id} />
        </div>

        <div className="px-6 py-4 bg-muted/20 border-t border-border/40 flex justify-end shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl text-xs font-bold border border-border/60 hover:bg-muted/50 transition-all gap-2"
          >
            <ArrowLeft className="w-4 h-4 ml-1" />
            סגור חלון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
