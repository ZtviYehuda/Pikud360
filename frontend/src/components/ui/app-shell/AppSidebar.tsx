import * as React from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "../button";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { cn } from "../../../lib/utils";
import { NavigationItem, SidebarItemProps, SidebarSectionProps, AppSidebarProps } from "./types";

// ==========================================
// 1. SidebarItem Component (Recursive Nesting)
// ==========================================
export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isCollapsed = false,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Checks if any nested item matches active state recursively
  const hasActiveSub = React.useMemo(() => {
    const checkActive = (navItem: NavigationItem): boolean => {
      if (navItem.href === isActive.toString()) return true;
      return navItem.items?.some(checkActive) || false;
    };
    return item.items?.some(checkActive) || false;
  }, [item.items, isActive]);

  React.useEffect(() => {
    if (hasActiveSub) {
      setIsOpen(true);
    }
  }, [hasActiveSub]);

  const hasSubItems = item.items && item.items.length > 0;

  const handleTriggerClick = () => {
    if (hasSubItems) {
      setIsOpen((prev) => !prev);
    } else if (item.href) {
      onNavigate?.(item.href);
    }
  };

  return (
    <div className="flex flex-col w-full select-none">
      <button
        onClick={handleTriggerClick}
        disabled={item.disabled}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-enterprise-md text-enterprise-body-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary disabled:opacity-50 disabled:cursor-not-allowed select-none text-right cursor-pointer",
          isActive && !hasSubItems
            ? "bg-enterprise-primary/10 text-enterprise-primary font-bold border-l-2 border-enterprise-primary rounded-l-none"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold"
        )}
      >
        {item.icon && (
          <span className="shrink-0 text-slate-450 dark:text-slate-500" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span className="shrink-0">{item.badge}</span>
        )}
        {!isCollapsed && hasSubItems && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0",
              isOpen && "transform rotate-180"
            )}
          />
        )}
      </button>

      {/* Recursive rendering of children sub-items */}
      {hasSubItems && isOpen && !isCollapsed && (
        <div className="flex flex-col pr-6 pl-2 mt-1 border-r border-enterprise-border gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {item.items?.map((sub) => (
            <SidebarItem
              key={sub.id}
              item={sub}
              isActive={isActive}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
SidebarItem.displayName = "SidebarItem";

// ==========================================
// 2. SidebarSection Component
// ==========================================
export const SidebarSection: React.FC<SidebarSectionProps> = ({
  heading,
  isCollapsed = false,
  children,
}) => {
  return (
    <div className="flex flex-col w-full gap-1">
      {heading && !isCollapsed && (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider px-3 py-1.5 select-none text-right">
          {heading}
        </span>
      )}
      {children}
    </div>
  );
};
SidebarSection.displayName = "SidebarSection";

// ==========================================
// 3. AppSidebar Component
// ==========================================
export const AppSidebar: React.FC<AppSidebarProps> = ({
  logo,
  orgName = "Pikud360",
  navigationItems,
  currentPath,
  onNavigate,
  isCollapsed = false,
  onCollapseChange,
  currentWorkspace,
  workspaces = [],
  onWorkspaceChange,
  sidebarTop,
  sidebarBottom,
}) => {
  // Group navigation items by group header
  const groups = React.useMemo(() => {
    const list: Record<string, NavigationItem[]> = {};
    navigationItems.forEach((item) => {
      if (item.hidden) return;
      const grp = item.group || "ראשי";
      if (!list[grp]) {
        list[grp] = [];
      }
      list[grp].push(item);
    });
    return list;
  }, [navigationItems]);

  return (
    <aside
      className={cn(
        "h-full border-l border-enterprise-border bg-enterprise-surface flex flex-col transition-all duration-300 select-none relative z-40 shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header Block */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-enterprise-border shrink-0 select-none">
        {logo && <div className="shrink-0">{logo}</div>}
        {!isCollapsed && (
          <div className="text-right flex flex-col justify-center">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {orgName}
            </span>
          </div>
        )}
      </div>

      {/* Top Sidebar Slot */}
      {sidebarTop && !isCollapsed && (
        <div className="p-3 border-b border-enterprise-border shrink-0">
          {sidebarTop}
        </div>
      )}

      {/* Workspace Switcher */}
      {!isCollapsed && workspaces.length > 0 && (
        <div className="p-3 border-b border-enterprise-border shrink-0 select-none flex justify-center">
          <WorkspaceSwitcher
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
            onChange={onWorkspaceChange}
          />
        </div>
      )}

      {/* Navigation Links Scroll area */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(groups).map(([groupHeading, items]) => (
          <SidebarSection key={groupHeading} heading={groupHeading} isCollapsed={isCollapsed}>
            {items.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentPath === item.href}
                isCollapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarSection>
        ))}
      </nav>

      {/* Bottom Sidebar Slot */}
      {sidebarBottom && !isCollapsed && (
        <div className="p-3 border-t border-enterprise-border shrink-0">
          {sidebarBottom}
        </div>
      )}

      {/* Sidebar collapse toggle button */}
      {onCollapseChange && (
        <div className="p-3 border-t border-enterprise-border shrink-0 select-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapseChange(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <>
                <span className="text-xs font-bold text-slate-500">צמצם תפריט</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
};
AppSidebar.displayName = "AppSidebar";
