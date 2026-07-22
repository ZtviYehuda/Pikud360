import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Drag Handle — visual indicator for bottom sheet swipe affordance.
 * Renders a small pill at the top center of the dialog. Only visible on mobile.
 */
function DialogDragHandle({ className }: { className?: string }) {
  return (
    <div
      data-slot="dialog-drag-handle"
      className={cn(
        "mx-auto mt-3 mb-1 w-9 h-[5px] rounded-full bg-foreground/20 shrink-0 sm:hidden",
        className,
      )}
      aria-hidden
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  // Mobile popstate back-button interceptor:
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const stateKey = "modal-" + Math.random().toString(36).substring(2, 11);
    window.history.pushState({ modalState: stateKey }, "");

    const handlePopState = () => {
      // Dispatch Escape key down event to trigger Radix UI close handler
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state && window.history.state.modalState === stateKey) {
        window.history.back();
      }
    };
  }, []);

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // ── Mobile: Native Bottom Sheet ──
          "bg-background text-foreground fixed z-50 flex flex-col w-full outline-none overflow-hidden border-none",
          // Edge-to-edge, dynamic height, safe-area bottom padding
          "bottom-0 left-0 right-0 max-h-[92svh] rounded-t-2xl",
          // Mobile slide-up animation
          "data-[state=open]:animate-slide-up-mobile data-[state=closed]:animate-slide-down-mobile",
          // ── Desktop: Centered Modal ──
          "sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:right-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:max-h-[calc(100svh-2rem)] sm:rounded-2xl sm:border",
          // Desktop fade animation (override mobile)
          "sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        {/* Close button: hidden on mobile (drag handle replaces it), visible on desktop */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="hidden sm:flex absolute left-4 top-4 p-0 rounded-full opacity-70 ring-offset-background transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white/80 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10 h-9 w-9 items-center justify-center z-[50] [&_svg]:size-5 [&_svg]:text-foreground/80 hover:bg-white dark:hover:bg-black hover:[&_svg]:rotate-90 [&_svg]:transition-transform"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-right", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogDragHandle,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
