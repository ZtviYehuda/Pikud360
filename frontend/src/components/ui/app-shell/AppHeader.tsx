import * as React from "react";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { UserMenu } from "./UserMenu";
import { AppHeaderProps, BreadcrumbBarProps } from "./types";

// ==========================================
// BreadcrumbBar Layout Component
// ==========================================
export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  breadcrumbs = [],
  onNavigate,
}) => {
  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 select-none" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-[9px]" aria-hidden="true">/</span>}
            {isLast || !item.href ? (
              <span className="font-semibold text-slate-650 dark:text-slate-350 truncate">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => onNavigate?.(item.href!)}
                className="hover:text-slate-700 dark:hover:text-slate-350 transition-colors font-medium cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ==========================================
// AppHeader Component
// ==========================================
export const AppHeader: React.FC<AppHeaderProps> = ({
  pageTitle,
  breadcrumbs = [],
  onNavigate,
  user,
  onLogout,
  onPreferencesClick,
  onSearchClick,
  onCommandPaletteClick,
  notificationCount = 0,
  onNotificationClick,
  onMobileMenuToggle,
  headerStart,
  headerCenter,
  headerEnd,
}) => {
  return (
    <header className="h-16 border-b border-enterprise-border bg-enterprise-surface flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 select-none">
      {/* Start Area Slot (RTL Right side, standard Left side mapping) */}
      <div className="flex items-center gap-3">
        {headerStart}

        {/* Global Search Button Placeholder */}
        {onSearchClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="חיפוש גלובלי"
          >
            <Search className="h-4.5 w-4.5 text-slate-500" />
          </Button>
        )}

        {/* Notifications trigger Placeholder */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNotificationClick}
          className="hover:bg-slate-100 dark:hover:bg-slate-800 relative"
          aria-label="התראות"
        >
          <Bell className="h-4.5 w-4.5 text-slate-500" />
          {notificationCount > 0 && (
            <Badge
              variant="danger"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold border border-white dark:border-slate-900"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        {/* Command Palette Trigger Keyboard helper placeholder */}
        {onCommandPaletteClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCommandPaletteClick}
            className="h-8 text-enterprise-caption gap-1.5 hidden md:flex"
            aria-label="פלאטת פקודות"
          >
            <span className="font-semibold text-slate-500">פלאטת פקודות</span>
            <kbd className="bg-slate-100 dark:bg-slate-850 px-1 rounded-enterprise-sm text-[9px] font-bold text-slate-450 select-none">
              Ctrl+K
            </kbd>
          </Button>
        )}

        {/* User profile dropdown triggers */}
        {user && (
          <UserMenu user={user} onLogout={onLogout} onPreferencesClick={onPreferencesClick} />
        )}
      </div>

      {/* Center Area Slot */}
      <div className="hidden md:flex items-center justify-center flex-1 mx-4">
        {headerCenter || <div />}
      </div>

      {/* End Area Slot */}
      <div className="flex items-center gap-3">
        {headerEnd}

        {/* Page title and Breadcrumb bar layout */}
        <div className="text-right flex flex-col justify-center">
          {breadcrumbs.length > 0 ? (
            <BreadcrumbBar breadcrumbs={breadcrumbs} onNavigate={onNavigate} />
          ) : (
            pageTitle && (
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {pageTitle}
              </h1>
            )
          )}
        </div>

        {/* Mobile menu trigger */}
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="תפריט ניווט"
          >
            <Menu className="h-5 w-5 text-slate-650" />
          </Button>
        )}
      </div>
    </header>
  );
};
AppHeader.displayName = "AppHeader";
