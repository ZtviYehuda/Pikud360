import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva } from "class-variance-authority";
import { ActionGroup } from "./layout-primitives";
import { cn } from "../../lib/utils";

// ==========================================
// Types
// ==========================================

export interface DrawerContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> {
  /** Optional title rendered as an accessible DialogPrimitive.Title */
  title?: React.ReactNode;
  /** Optional subtitle rendered as an accessible DialogPrimitive.Description */
  description?: React.ReactNode;
}

// ==========================================
// CVA Variants
// ==========================================

const drawerContentVariants = cva(
  [
    // Base layout
    "fixed z-50 flex flex-col",
    "bg-white dark:bg-slate-900",
    "shadow-xl focus:outline-none",
    "transition ease-in-out",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "duration-300",
  ].join(" "),
  {
    variants: {
      position: {
        // Mobile: bottom sheet
        mobile: [
          "inset-x-0 bottom-0",
          "w-full max-h-[85vh]",
          "rounded-t-2xl",
          "border-t border-slate-200 dark:border-slate-800",
          "data-[state=closed]:slide-out-to-bottom",
          "data-[state=open]:slide-in-from-bottom",
        ].join(" "),
        // Desktop: right-side drawer
        desktop: [
          "inset-y-0 right-0",
          "h-full w-[480px]",
          "border-l border-slate-200 dark:border-slate-800",
          "data-[state=closed]:slide-out-to-right",
          "data-[state=open]:slide-in-from-right",
        ].join(" "),
      },
    },
    defaultVariants: {
      position: "mobile",
    },
  }
);

// ==========================================
// Primitives (thin wrappers around Radix)
// ==========================================

/** Root drawer context — controls open/close state. */
export const Drawer = DialogPrimitive.Root;
Drawer.displayName = "Drawer";

/** Trigger element that opens the drawer when clicked. */
export const DrawerTrigger = DialogPrimitive.Trigger;
DrawerTrigger.displayName = "DrawerTrigger";

/** Programmatic close button primitive. */
export const DrawerClose = DialogPrimitive.Close;
DrawerClose.displayName = "DrawerClose";

/** Portal root — mounts drawer outside the normal DOM flow. */
export const DrawerPortal = DialogPrimitive.Portal;
DrawerPortal.displayName = "DrawerPortal";

// ==========================================
// DrawerOverlay
// ==========================================

/** Backdrop overlay behind the drawer panel. */
export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/60 backdrop-blur-sm",
      "transition-all duration-200",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

// ==========================================
// DrawerContent
// ==========================================

/**
 * Main Drawer panel.
 *
 * Automatically adapts:
 * - Mobile:  Bottom Sheet (slides in from bottom, max-height 85vh)
 * - Desktop: Right-side Drawer (slides in from right, full height)
 *
 * Accessibility:
 * - Focus trap managed by Radix Dialog
 * - ESC key closes drawer
 * - Focus restored to trigger after close
 * - ARIA roles applied automatically by Radix
 */
export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, title, description, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Mobile base (bottom sheet)
        drawerContentVariants({ position: "mobile" }),
        // Desktop override (right drawer) via responsive prefix
        "md:inset-x-auto md:inset-y-0 md:right-0 md:left-auto",
        "md:h-full md:w-[480px] md:max-h-none",
        "md:rounded-none md:border-l md:border-t-0",
        "md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right",
        "md:data-[state=closed]:slide-out-to-bottom-[0px] md:data-[state=open]:slide-in-from-bottom-[0px]",
        className
      )}
      {...props}
    >
      {/* ── Drag handle (mobile only) ── */}
      <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
        <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>

      {/* ── Close button ── */}
      <DialogPrimitive.Close
        className={cn(
          "absolute top-4 right-4",
          "h-8 w-8 rounded-lg",
          "flex items-center justify-center",
          "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "disabled:pointer-events-none"
        )}
        aria-label="סגור"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </DialogPrimitive.Close>

      {/* ── Accessible title / description ── */}
      {(title || description) && (
        <div className="px-6 pt-4 pb-0 space-y-1 select-none pr-12">
          {title && (
            <DialogPrimitive.Title
              className={cn(
                "text-base font-semibold leading-tight",
                "text-slate-900 dark:text-white"
              )}
            >
              {title}
            </DialogPrimitive.Title>
          )}
          {description && (
            <DialogPrimitive.Description
              className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

// ==========================================
// DrawerHeader
// ==========================================

/**
 * Optional semantic header block for use inside DrawerContent children.
 * Use when you need a header section within the scrollable body itself
 * (e.g., section title, breadcrumbs, entity name).
 */
export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1",
      "pb-4 mb-4",
      "border-b border-slate-200 dark:border-slate-800",
      "select-none text-right",
      className
    )}
    {...props}
  />
));
DrawerHeader.displayName = "DrawerHeader";

// ==========================================
// DrawerFooter
// ==========================================

/**
 * Sticky footer container.
 * Always rendered below the scrollable content area.
 * Use for primary/secondary action buttons.
 */
export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0",
      "px-6 py-4",
      "border-t border-slate-200 dark:border-slate-800",
      "bg-white dark:bg-slate-900",
      "select-none",
      className
    )}
    {...props}
  />
));
DrawerFooter.displayName = "DrawerFooter";

// ==========================================
// DrawerActions
// ==========================================

/**
 * Action button alignment container inside DrawerFooter.
 * Composes the layout-primitives ActionGroup with end alignment.
 *
 * @example
 * <DrawerFooter>
 *   <DrawerActions>
 *     <Button variant="outline" onClick={onCancel}>ביטול</Button>
 *     <Button variant="primary" onClick={onSave}>שמור</Button>
 *   </DrawerActions>
 * </DrawerFooter>
 */
export const DrawerActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ActionGroup
    ref={ref}
    className={cn("justify-end", className)}
    {...props}
  />
));
DrawerActions.displayName = "DrawerActions";
