import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, Landmark, LayoutGrid, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilter: (
    filterType: "all" | "department" | "section",
    id?: number,
  ) => void;
}

export const ChartFilterDialog = ({
  open,
  onOpenChange,
  onApplyFilter,
}: ChartFilterDialogProps) => {
  const [filterType, setFilterType] = useState<
    "all" | "department" | "section"
  >("all");

  const handleApply = () => {
    onApplyFilter(filterType);
    onOpenChange(false);
  };

  // If not admin or commander, disable department/section filters
  const canFilter = true; // TODO: implement permissions check

  const FilterOption = ({ id, value, title, description, icon: Icon, colorClass }: any) => (
    <div
      className={cn(
        "relative flex items-center justify-between p-5 rounded-[28px] border-2 transition-all cursor-pointer group",
        filterType === value
          ? cn("border-primary bg-primary/5  ", colorClass)
          : "border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border/50 text-muted-foreground"
      )}
      onClick={() => setFilterType(value)}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
          filterType === value ? "bg-primary text-primary-foreground " : "bg-background text-muted-foreground "
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col text-right">
          <Label htmlFor={id} className="text-base font-black cursor-pointer leading-tight group-hover:text-foreground transition-colors">
            {title}
          </Label>
          <p className="text-[11px] font-bold opacity-60 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        filterType === value ? "bg-primary border-primary" : "border-muted-foreground/30 bg-transparent"
      )}>
        {filterType === value && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <RadioGroupItem value={value} id={id} className="sr-only" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 border-none sm:border sm:border-border bg-card flex flex-col"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary  shrink-0 rotate-3">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1 text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight mb-1">
                הגדרות תצוגת גרף
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                בחר את רמת הפירוט והשיוך הארגוני להצגה בגרף המרכזי שבדף הבית
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 sm:p-8 space-y-4 overflow-y-auto custom-scrollbar">
          <RadioGroup
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
            className="grid gap-4"
          >
            <FilterOption
              id="all"
              value="all"
              title="כלל היחידה"
              description="הצגת נתוני מאקרו עבור כלל המשרתים תחת פיקודך"
              icon={Users}
            />

            {canFilter && (
              <FilterOption
                id="department"
                value="department"
                title="פילוח מחלקתי"
                description="ניתוח השוואתי בין מחלקות שונות ביחידה"
                icon={Landmark}
              />
            )}

            {canFilter && (
              <FilterOption
                id="section"
                value="section"
                title="פילוח מדורי"
                description="ירידה לרזולוציית המדורים והחוליות המקצועיות"
                icon={LayoutGrid}
              />
            )}
          </RadioGroup>
        </div>

        <div className="p-6 sm:p-8 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8 h-12 font-black text-muted-foreground hover:text-foreground hover:bg-transparent rounded-2xl transition-all order-2 sm:order-1 text-xs uppercase tracking-widest gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ביטול וחזרה
          </Button>

          <Button
            onClick={handleApply}
            className="w-full sm:flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl   transition-all active:scale-[0.98] text-base gap-3 order-1 sm:order-2"
          >
            <Check className="w-5 h-5" />
            עדכן תצוגת גרף
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
