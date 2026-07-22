import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClearFiltersButton } from "@/components/shared/page-toolbar";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onApply?: () => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
  resultCount?: number;
  applyText?: string;
  loading?: boolean;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onOpenChange,
  title = "סינון",
  description,
  onApply,
  onReset,
  hasActiveFilters = false,
  activeFiltersCount = 0,
  resultCount,
  applyText,
  loading = false,
  children,
  headerContent,
  footerContent,
  className,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className={cn(
          "max-w-2xl w-[95vw] sm:w-[500px] max-h-[90vh] flex flex-col p-0 gap-0 border-border/40 bg-card rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl",
          className
        )}
      >
        <DialogDragHandle />

        {/* Header */}
        <div className="px-6 pt-2 pb-4 border-b border-border/30 flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-black text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            )}
          </div>

          {onReset && (
            <ClearFiltersButton
              hasActiveFilters={hasActiveFilters}
              onClick={onReset}
              className="ml-10"
            />
          )}
        </div>

        {headerContent && (
          <div className="px-4 border-b border-border/30 shrink-0">
            {headerContent}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar max-h-[60vh]">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 shrink-0 bg-background/50">
          {footerContent ? (
            footerContent
          ) : (
            <Button
              id="apply-filters-btn"
              onClick={() => {
                if (onApply) onApply();
                onOpenChange(false);
              }}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-14 transition-all active:scale-[0.98] text-base gap-2 shadow-none cursor-pointer"
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span>
                {applyText ||
                  (resultCount !== undefined
                    ? `הצג ${resultCount} תוצאות`
                    : "החל מסננים")}
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
