import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { cn } from "../../lib/utils";

// ==========================================
// 1. Dialog Core Primitives
// ==========================================
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-all duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ==========================================
// 2. DialogContent & Layout Primitives
// ==========================================
export interface DialogContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, title, description, icon, footer, loading = false, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-hidden flex flex-col gap-4 select-none",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Close Button on left side (for RTL layout support) */}
        <DialogPrimitive.Close className="absolute left-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-350 disabled:pointer-events-none cursor-pointer">
          <X className="h-4.5 w-4.5 text-slate-400" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        {/* Dialog Header Area */}
        {(title || description || icon) && (
          <div className="flex items-start gap-3 select-none pr-2 pl-6">
            {icon && (
              <div className="flex shrink-0 items-center justify-center p-2 rounded-full bg-slate-50 dark:bg-slate-850">
                {icon}
              </div>
            )}
            <div className="flex-1 text-right min-w-0">
              {title && (
                <DialogPrimitive.Title className="text-base font-semibold leading-tight text-slate-900 dark:text-white truncate">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          </div>
        )}

        {/* Dialog Content Area (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1 py-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3" aria-busy="true">
              <Spinner size="default" />
              <span className="text-enterprise-caption text-slate-500">טוען...</span>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Sticky Footer Slot */}
        {footer && (
          <div className="shrink-0 pt-3 border-t border-enterprise-border bg-white dark:bg-slate-900 mt-auto">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-right select-none",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 select-none",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>((({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-bold text-slate-900 dark:text-white leading-none tracking-tight",
      className
    )}
    {...props}
  />
)));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed", className)}
    {...props}
  />
)));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ==========================================
// 3. DialogActions Component
// ==========================================
export interface DialogActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogActions = React.forwardRef<HTMLDivElement, DialogActionsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-2 w-full flex-wrap-reverse", className)}
      {...props}
    />
  )
);
DialogActions.displayName = "DialogActions";

// ==========================================
// 4. ConfirmationDialog Component
// ==========================================
export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "primary" | "danger" | "warning" | "success" | "info";
  icon?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "אשר",
  cancelLabel = "ביטול",
  loading = false,
  variant = "primary",
  icon,
}) => {
  const variantIcons = {
    primary: <Info className="h-5 w-5 text-blue-500" />,
    danger: <Trash2 className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const selectedIcon = icon || variantIcons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        icon={selectedIcon}
        size="sm"
        footer={
          <DialogActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={async () => {
                await onConfirm();
                onOpenChange(false);
              }}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </DialogActions>
        }
      />
    </Dialog>
  );
};

// ==========================================
// 5. DeleteDialog Component
// ==========================================
export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onDelete: () => void | Promise<void>;
  loading?: boolean;
  itemName?: string;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  title = "מחיקת פריט",
  description,
  onDelete,
  loading = false,
  itemName,
}) => {
  const dynamicDescription = description || (itemName ? `האם אתה בטוח שברצונך למחוק את "${itemName}"? פעולה זו היא בלתי הפיכה.` : "האם אתה בטוח שברצונך למחוק פריט זה? פעולה זו היא בלתי הפיכה.");

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={dynamicDescription}
      onConfirm={onDelete}
      confirmLabel="מחק"
      loading={loading}
      variant="danger"
      icon={<Trash2 className="h-5 w-5 text-red-500" />}
    />
  );
};

// ==========================================
// 6. AlertDialog Component
// ==========================================
export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  variant?: "info" | "warning" | "success" | "danger";
  icon?: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onClose,
  closeLabel = "הבנתי",
  variant = "info",
  icon,
}) => {
  const variantIcons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    danger: <AlertTriangle className="h-5 w-5 text-red-500" />,
  };

  const selectedIcon = icon || variantIcons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        icon={selectedIcon}
        size="sm"
        footer={
          <DialogActions>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={() => {
                onClose?.();
                onOpenChange(false);
              }}
            >
              {closeLabel}
            </Button>
          </DialogActions>
        }
      />
    </Dialog>
  );
};
