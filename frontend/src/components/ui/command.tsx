import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "../../lib/utils";
import { Dialog, DialogContent } from "./dialog";
import { Spinner } from "./spinner";

// ==========================================
// 1. Keyboard Shortcut Registration Hook
// ==========================================
export function useKeyboardShortcut(
  keys: string[],
  callback: (e: KeyboardEvent) => void,
  options?: { disabled?: boolean }
) {
  React.useEffect(() => {
    if (options?.disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const match = keys.every((key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "control" || lowerKey === "ctrl") return event.ctrlKey;
        if (lowerKey === "meta" || lowerKey === "cmd") return event.metaKey;
        if (lowerKey === "shift") return event.shiftKey;
        if (lowerKey === "alt") return event.altKey;
        return event.key.toLowerCase() === lowerKey;
      });

      if (match) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keys, callback, options?.disabled]);
}

// ==========================================
// 2. Command Palette Core Types
// ==========================================
export interface CommandPaletteAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  keywords?: string[];
  disabled?: boolean;
  hidden?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandPaletteAction[];
  pinnedActions?: CommandPaletteAction[];
  recentActions?: CommandPaletteAction[];
  loading?: boolean;
  placeholder?: string;
}

// ==========================================
// 3. Command Components (SHADCN wrappers)
// ==========================================
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmd-group-heading]]:px-2 [&_[cmd-group-heading]]:font-medium [&_[cmd-group-heading]]:text-slate-500 [&_[cmd-group-heading]]:dark:text-slate-400 [&_[cmd-group]]:px-2 [&_[cmd-input-wrapper]_svg]:h-5 [&_[cmd-input-wrapper]_svg]:w-5 [&_[cmd-input]]:h-12 [&_[cmd-item]]:px-2 [&_[cmd-item]]:py-3 [&_[cmd-item]_svg]:h-5 [&_[cmd-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-slate-200 px-3 dark:border-slate-800" cmd-input-wrapper="">
    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-500 text-right",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-slate-500"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-slate-900 [&_[cmd-group-heading]]:px-2 [&_[cmd-group-heading]]:py-1.5 [&_[cmd-group-heading]]:text-[10px] [&_[cmd-group-heading]]:font-bold [&_[cmd-group-heading]]:text-slate-450 dark:text-slate-100 [&_[cmd-group-heading]]:dark:text-slate-500 [&_[cmd-group-heading]]:uppercase [&_[cmd-group-heading]]:tracking-wider [&_[cmd-group-heading]]:mb-1 text-right",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-slate-200 dark:bg-slate-800", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-sm outline-hidden data-[selected='true']:bg-slate-50 data-[selected=true]:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:data-[selected='true']:bg-slate-800/60 dark:data-[selected=true]:text-slate-50 border border-transparent data-[selected='true']:border-slate-200 dark:data-[selected='true']:border-slate-700/55 transition-colors duration-150 text-right",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "mr-auto text-[10px] font-bold text-slate-400 dark:text-slate-500",
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

// ==========================================
// 4. CommandPaletteItem Component
// ==========================================
const CommandPaletteItem: React.FC<{ action: CommandPaletteAction }> = ({ action }) => {
  return (
    <CommandItem
      onSelect={() => action.onSelect()}
      disabled={action.disabled}
      className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none rounded-enterprise-md text-enterprise-body-sm text-slate-800 dark:text-slate-200 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800/80 data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none"
    >
      {action.icon && (
        <span className="shrink-0 text-slate-450 dark:text-slate-500" aria-hidden="true">
          {action.icon}
        </span>
      )}
      <div className="flex-1 flex flex-col text-right">
        <span className="font-semibold">{action.title}</span>
        {action.description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-555 font-medium mt-0.5">
            {action.description}
          </span>
        )}
      </div>
      {action.shortcut && (
        <CommandShortcut className="shrink-0 bg-slate-200/50 dark:bg-slate-850 px-1.5 py-0.5 rounded-enterprise-sm text-[9px] font-bold tracking-wider text-slate-500 dark:text-slate-400 select-none">
          {action.shortcut}
        </CommandShortcut>
      )}
    </CommandItem>
  );
};

// ==========================================
// 5. CommandPalette (Main Component)
// ==========================================
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  actions,
  pinnedActions = [],
  recentActions = [],
  loading = false,
  placeholder = "חפש פקודה...",
}) => {
  // Filter out hidden actions
  const visibleActions = actions.filter((action) => !action.hidden);

  // Group actions by category
  const categories = React.useMemo(() => {
    const groups: Record<string, CommandPaletteAction[]> = {};
    visibleActions.forEach((action) => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    return groups;
  }, [visibleActions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 gap-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none",
          // Mobile full-screen layout
          "fixed inset-0 w-full h-full max-h-none rounded-none translate-x-0 translate-y-0 left-0 top-0 border-0 flex flex-col",
          // Desktop centered modal overlay
          "md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:w-full md:max-w-[550px] md:h-auto md:max-h-[80vh] md:rounded-xl md:border md:shadow-2xl"
        )}
      >
        <Command className="flex flex-col h-full w-full overflow-hidden [&_[cmd-group-heading]]:px-3 [&_[cmd-group-heading]]:font-bold [&_[cmd-group-heading]]:text-slate-400 [&_[cmd-group-heading]]:dark:text-slate-500 [&_[cmd-group]]:px-2 [&_[cmd-input]]:h-12">
          <CommandInput placeholder={placeholder} autoFocus />
          <CommandList className="flex-1 overflow-y-auto max-h-none md:max-h-[350px]">
            {loading ? (
              <div className="py-6 flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span className="text-enterprise-caption text-slate-500">טוען פקודות...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>

                {/* Pinned / Favorite actions */}
                {pinnedActions.length > 0 && (
                  <>
                    <CommandGroup heading="מועדפים">
                      {pinnedActions.map((action) => (
                        <CommandPaletteItem key={action.id} action={action} />
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* Recently used actions */}
                {recentActions.length > 0 && (
                  <>
                    <CommandGroup heading="פקודות אחרונות">
                      {recentActions.map((action) => (
                        <CommandPaletteItem key={action.id} action={action} />
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* Categorized command groups */}
                {Object.entries(categories).map(([category, items], idx, arr) => (
                  <React.Fragment key={category}>
                    <CommandGroup heading={category}>
                      {items.map((action) => (
                        <CommandPaletteItem key={action.id} action={action} />
                      ))}
                    </CommandGroup>
                    {idx < arr.length - 1 && <CommandSeparator />}
                  </React.Fragment>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
