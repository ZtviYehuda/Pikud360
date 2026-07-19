import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// ==========================================
// Types
// ==========================================

export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

// ==========================================
// CVA Variants — Responsive Panel
//
// Single implementation. Responsive breakpoint:
//   < md  →  Bottom Sheet  (slides from bottom, max-h bound)
//   ≥ md  →  Right Drawer  (slides from right, full height)
// ==========================================

const drawerPanelVariants = cva(
  [
    // ── Shared base ──
    "fixed z-50 flex flex-col overflow-hidden",
    "bg-white dark:bg-slate-900",
    "shadow-2xl focus:outline-none",
    "transition ease-in-out duration-300",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",

    // ── Mobile: bottom sheet ──
    "inset-x-0 bottom-0 w-full rounded-t-2xl",
    "border-t border-slate-200 dark:border-slate-800",
    "data-[state=closed]:slide-out-to-bottom",
    "data-[state=open]:slide-in-from-bottom",

    // ── Desktop: right-side drawer (responsive override) ──
    "md:inset-x-auto md:inset-y-0 md:right-0 md:left-auto",
    "md:h-full md:max-h-none",
    "md:border-t-0 md:border-l md:border-slate-200 dark:md:border-slate-800",
    "md:rounded-none md:rounded-l-2xl",
    "md:data-[state=closed]:slide-out-to-right",
    "md:data-[state=open]:slide-in-from-right",
  ].join(" "),
  {
    variants: {
      /**
       * Size presets.
       * Mobile: controls max-height of the bottom sheet.
       * Desktop: controls the panel width.
       */
      size: {
        sm:   "max-h-[55vh]  md:w-[340px]",
        md:   "max-h-[75vh]  md:w-[480px]",
        lg:   "max-h-[85vh]  md:w-[600px]",
        xl:   "max-h-[92vh]  md:w-[720px]",
        full: "max-h-[100vh] md:w-screen",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// ==========================================
// 1. Drawer (Root)
// ==========================================

export interface DrawerProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /** Lifecycle callback — called when the drawer opens. No business logic here. */
  onOpen?: () => void;
  /** Lifecycle callback — called when the drawer closes. No business logic here. */
  onClose?: () => void;
}

/**
 * Root wrapper. Controls open/close state via Radix Dialog primitive.
 *
 * Exposes `onOpen` and `onClose` lifecycle callbacks for external coordination
 * (e.g. resetting form state, analytics, focus management).
 */
export const Drawer: React.FC<DrawerProps> = ({
  onOpen,
  onClose,
  onOpenChange,
  ...props
}) => (
  <DialogPrimitive.Root
    onOpenChange={(open) => {
      onOpenChange?.(open);
      if (open) onOpen?.();
      else onClose?.();
    }}
    {...props}
  />
);
Drawer.displayName = "Drawer";

// ==========================================
// 2. Thin Primitive Wrappers
// ==========================================

/** Element that opens the Drawer on click. */
export const DrawerTrigger = DialogPrimitive.Trigger;
DrawerTrigger.displayName = "DrawerTrigger";

/** Programmatic close primitive. Wrap a custom button with this to close. */
export const DrawerClose = DialogPrimitive.Close;
DrawerClose.displayName = "DrawerClose";

/** Portal root — mounts drawer outside the normal DOM flow. */
export const DrawerPortal = DialogPrimitive.Portal;
DrawerPortal.displayName = "DrawerPortal";

// ==========================================
// 3. DrawerOverlay
// ==========================================

/** Dark backdrop rendered behind the drawer panel. */
export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
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
// 4. DrawerContent (Panel Shell)
// ==========================================

export interface DrawerContentProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
      "title"
    >,
    VariantProps<typeof drawerPanelVariants> {
  /**
   * Accessible panel title.
   * Rendered as DialogPrimitive.Title — read aloud when drawer opens.
   */
  title?: React.ReactNode;
  /**
   * Accessible panel subtitle.
   * Rendered as DialogPrimitive.Description — read aloud when drawer opens.
   */
  description?: React.ReactNode;
  /**
   * Sticky footer slot.
   *
   * Content placed here is rendered OUTSIDE the scrollable body area,
   * pinned to the bottom of the panel. Use DrawerFooter + DrawerActions here.
   *
   * @example
   * footer={
   *   <DrawerFooter>
   *     <DrawerActions>
   *       <Button variant="outline">ביטול</Button>
   *       <Button variant="primary">שמור</Button>
   *     </DrawerActions>
   *   </DrawerFooter>
   * }
   */
  footer?: React.ReactNode;
  /**
   * When true, replaces the body content with a loading skeleton.
   * The sticky footer remains visible during loading.
   */
  loading?: boolean;
}

/**
 * Adaptive Drawer panel shell.
 *
 * ## Anatomy
 * ```
 * DrawerContent
 * ├── [drag handle — mobile only]
 * ├── Panel header (title / description / close button)
 * ├── Scrollable body  ← children render here
 * └── Sticky footer    ← footer prop renders here
 * ```
 *
 * ## Responsive behavior
 * - Mobile  (`< md`):  Bottom Sheet, slides from bottom.
 * - Desktop (`≥ md`):  Right-side Panel, slides from right.
 *
 * ## Accessibility (via Radix Dialog)
 * - Focus trap on open
 * - ESC key closes
 * - Focus restored to trigger on close
 * - `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
 */
export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      className,
      children,
      title,
      description,
      footer,
      loading = false,
      size = "md",
      ...props
    },
    ref
  ) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(drawerPanelVariants({ size }), className)}
        {...props}
      >
        {/* ── Drag handle (mobile only) ── */}
        <div
          className="flex shrink-0 justify-center pt-3 pb-1 md:hidden"
          aria-hidden="true"
        >
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* ── Panel header ── */}
        <div
          className={cn(
            "shrink-0 flex items-start gap-3 px-6",
            title || description
              ? "pt-4 pb-3 border-b border-slate-200 dark:border-slate-800"
              : "pt-2 pb-0"
          )}
        >
          {/* Title + description block */}
          {(title || description) && (
            <div className="flex flex-col space-y-0.5 flex-1 text-right min-w-0">
              {title && (
                <DialogPrimitive.Title className="text-base font-semibold leading-snug text-slate-900 dark:text-white truncate">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}

          {/* Close button — always present */}
          <DialogPrimitive.Close
            className={cn(
              "shrink-0 h-8 w-8 rounded-lg",
              "flex items-center justify-center",
              "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              "disabled:pointer-events-none",
              // When no title/desc, push close to top-right
              !(title || description) && "ml-auto"
            )}
            aria-label="סגור"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse" aria-busy="true" aria-label="טוען...">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6" />
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl mt-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mt-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5" />
            </div>
          ) : (
            children
          )}
        </div>

        {/* ── Sticky footer slot ── */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DrawerPortal>
  )
);
DrawerContent.displayName = "DrawerContent";

// ==========================================
// 5. DrawerHeader
// ==========================================

/**
 * Optional semantic section header inside the scrollable body.
 *
 * Use for sub-section titles or entity name headers within the drawer content area.
 * This is separate from the built-in panel header (title/description) in DrawerContent.
 */
export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1 pb-4 mb-4",
      "border-b border-slate-200 dark:border-slate-800",
      "text-right select-none",
      className
    )}
    {...props}
  />
));
DrawerHeader.displayName = "DrawerHeader";

// ==========================================
// 6. DrawerTitle / DrawerDescription
//    (for use inside DrawerHeader, in the scrollable body)
// ==========================================

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold text-slate-900 dark:text-white",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

// ==========================================
// 7. DrawerFooter
// ==========================================

/**
 * Standalone footer wrapper for use inside the `footer` prop of DrawerContent.
 *
 * Guarantees sticky behavior — always visible regardless of content scroll position.
 *
 * @example
 * <DrawerContent
 *   footer={
 *     <DrawerFooter>
 *       <DrawerActions>
 *         <Button variant="outline">ביטול</Button>
 *         <Button variant="primary">שמור</Button>
 *       </DrawerActions>
 *     </DrawerFooter>
 *   }
 * >
 *   …body…
 * </DrawerContent>
 */
export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full select-none", className)}
    {...props}
  />
));
DrawerFooter.displayName = "DrawerFooter";

// ==========================================
// 8. DrawerActions
// ==========================================

/**
 * Right-aligned action button row.
 *
 * Always place inside DrawerFooter.
 * Primary action goes last (rightmost on desktop, bottommost on mobile).
 *
 * @example
 * <DrawerActions>
 *   <Button variant="outline">ביטול</Button>
 *   <Button variant="primary" loading={saving}>שמור שינויים</Button>
 * </DrawerActions>
 */
export const DrawerActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-2 flex-wrap-reverse",
      className
    )}
    {...props}
  />
));
DrawerActions.displayName = "DrawerActions";
