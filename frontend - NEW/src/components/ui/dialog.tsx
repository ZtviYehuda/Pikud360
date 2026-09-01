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
  const [translateY, setTranslateY] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [keyboardOffset, setKeyboardOffset] = React.useState(0);
  const touchStartY = React.useRef(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Mobile virtualViewport & Keyboard Focus Manager
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusIn = (e: FocusEvent) => {
      if (window.innerWidth >= 640) return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        setTimeout(() => {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 150);
      }
    };

    const handleViewportChange = () => {
      if (window.innerWidth >= 640) {
        setKeyboardOffset(0);
        return;
      }
      if (window.visualViewport) {
        const offset = window.innerHeight - window.visualViewport.height;
        if (offset > 100) {
          setKeyboardOffset(offset);
          const activeEl = document.activeElement as HTMLElement;
          if (
            activeEl &&
            (activeEl.tagName === "INPUT" ||
              activeEl.tagName === "TEXTAREA" ||
              activeEl.isContentEditable)
          ) {
            activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        } else {
          setKeyboardOffset(0);
        }
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener("focusin", handleFocusIn);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }

    return () => {
      if (container) {
        container.removeEventListener("focusin", handleFocusIn);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
    };
  }, []);

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

  const triggerClose = () => {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.innerWidth >= 640) return;
    const target = contentRef.current;
    if (!target || target.scrollTop <= 5) {
      touchStartY.current = e.touches[0].clientY;
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setTranslateY(deltaY);
    } else {
      setTranslateY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (translateY > 90) {
      triggerClose();
    }
    setTranslateY(0);
  };

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined,
          maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset + 12}px)` : undefined,
          transition: isSwiping ? "none" : "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          ...(props.style || {}),
        }}
        className={cn(
          // ── Mobile: Native Edge-to-Edge Bottom Sheet ──
          "bg-background text-foreground fixed z-50 flex flex-col outline-none overflow-y-auto custom-scrollbar border-none shadow-2xl transition-all",
          "bottom-0 left-0 right-0 w-full max-w-full max-h-[94dvh] rounded-t-[2.2rem] rounded-b-none p-4 sm:p-6",
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
        {/* Swipe Handle Indicator at top on Mobile */}
        <div className="w-full pt-1 pb-3 flex justify-center items-center shrink-0 sm:hidden touch-none select-none">
          <div className="w-12 h-1.5 rounded-full bg-foreground/20 hover:bg-foreground/30 transition-colors" />
        </div>

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
      className={cn("text-base sm:text-lg leading-tight font-bold tracking-tight text-foreground", className)}
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
      className={cn("text-xs text-muted-foreground font-normal leading-relaxed", className)}
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
