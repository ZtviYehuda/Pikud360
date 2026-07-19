import * as React from "react";
import { Menu } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent } from "../drawer";
import { SidebarItem } from "./AppSidebar";
import { cn } from "../../../lib/utils";
import { MobileNavigationProps } from "./types";

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  navigationItems,
  currentPath,
  onNavigate,
}) => {
  const visibleItems = navigationItems.filter((i) => !i.hidden);
  
  // First 4 elements are primary tabs on the bottom navigation
  const primaryItems = visibleItems.slice(0, 4);
  // Remaining items go into the drawer menu
  const secondaryItems = visibleItems.slice(4);

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 border-t border-enterprise-border bg-enterprise-surface flex items-center justify-around px-2 z-40 select-none md:hidden">
      {primaryItems.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <button
            key={item.id}
            onClick={() => item.href && onNavigate?.(item.href)}
            disabled={item.disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary rounded-enterprise-md disabled:opacity-50 cursor-pointer select-none",
              isActive ? "text-enterprise-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* "More" Secondary Drawer Menu trigger */}
      {secondaryItems.length > 0 && (
        <Drawer>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-slate-500 hover:text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary rounded-enterprise-md cursor-pointer select-none">
              <Menu className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-bold tracking-tight">עוד</span>
            </button>
          </DrawerTrigger>
          <DrawerContent title="תפריט ניווט" description="כל מסכי המערכת">
            <div className="flex flex-col gap-2 p-1">
              {secondaryItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={currentPath === item.href}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </nav>
  );
};
MobileNavigation.displayName = "MobileNavigation";
