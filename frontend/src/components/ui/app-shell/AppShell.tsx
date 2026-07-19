import * as React from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileNavigation } from "./MobileNavigation";
import { AppShellProvider, useAppShellContext } from "./context";
import { cn } from "../../../lib/utils";
import { AppShellProps } from "./types";

// ==========================================
// AppShellInner Component
// ==========================================
const AppShellInner: React.FC<Omit<AppShellProps, "layoutMode" | "sidebarCollapsed" | "onSidebarCollapseChange">> = ({
  children,
  navigationItems,
  currentPath,
  onNavigate,
  user,
  onLogout,
  onPreferencesClick,
  currentWorkspace,
  workspaces = [],
  onWorkspaceChange,
  pageTitle,
  breadcrumbs = [],
  onSearchClick,
  onCommandPaletteClick,
  notificationCount = 0,
  onNotificationClick,
  headerStart,
  headerCenter,
  headerEnd,
  sidebarTop,
  sidebarBottom,
  contentTop,
  contentBottom,
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    layoutMode,
  } = useAppShellContext();

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    setMobileMenuOpen(false);
  };

  const layoutPadding = {
    dashboard: "p-0",
    standard: "p-4 md:p-6",
    table: "p-2 md:p-4",
    "full-width": "p-0",
  };

  return (
    <div className="min-h-full h-full w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden relative font-sans antialiased">
      {/* Skip link for screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-enterprise-primary focus:text-white focus:rounded-enterprise-md focus:font-bold focus:shadow-md"
      >
        דלג לתוכן המרכזי
      </a>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full">
        <AppSidebar
          navigationItems={navigationItems}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onWorkspaceChange={onWorkspaceChange}
          sidebarTop={sidebarTop}
          sidebarBottom={sidebarBottom}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex select-none">
          {/* Backdrop Mask */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar drawer body */}
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-white dark:bg-slate-900 border-l border-enterprise-border animate-in slide-in-from-right duration-200">
            <div className="flex-1 overflow-y-auto">
              <AppSidebar
                navigationItems={navigationItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                isCollapsed={false}
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                onWorkspaceChange={onWorkspaceChange}
                sidebarTop={sidebarTop}
                sidebarBottom={sidebarBottom}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Sticky Header Top */}
        <AppHeader
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          onNavigate={handleNavigate}
          user={user}
          onLogout={onLogout}
          onPreferencesClick={onPreferencesClick}
          onSearchClick={onSearchClick}
          onCommandPaletteClick={onCommandPaletteClick}
          notificationCount={notificationCount}
          onNotificationClick={onNotificationClick}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          headerStart={headerStart}
          headerCenter={headerCenter}
          headerEnd={headerEnd}
        />

        {/* Content Top Slot */}
        {contentTop && <div className="shrink-0">{contentTop}</div>}

        {/* Scrollable Content View */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "flex-1 overflow-y-auto focus:outline-hidden",
            layoutPadding[layoutMode]
          )}
        >
          {children}
        </main>

        {/* Content Bottom Slot */}
        {contentBottom && <div className="shrink-0">{contentBottom}</div>}

        {/* Mobile Bottom navigation bar */}
        <MobileNavigation
          navigationItems={navigationItems}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
};

// ==========================================
// AppShell Component (Main Wrapper Provider)
// ==========================================
export const AppShell: React.FC<AppShellProps> = ({
  layoutMode = "standard",
  onLayoutModeChange,
  sidebarCollapsed = false,
  onSidebarCollapseChange,
  ...props
}) => {
  return (
    <AppShellProvider
      initialCollapsed={sidebarCollapsed}
      onCollapseChange={onSidebarCollapseChange}
      initialLayoutMode={layoutMode}
      onLayoutModeChange={onLayoutModeChange}
    >
      <AppShellInner {...props} />
    </AppShellProvider>
  );
};
AppShell.displayName = "AppShell";
