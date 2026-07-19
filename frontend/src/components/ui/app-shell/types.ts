import * as React from "react";

export interface NavigationSubItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  hidden?: boolean;
  requiredPermission?: string;
  featureFlag?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  group?: string; // Group header (e.g. "ראשי", "ניהול")
  badge?: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  requiredPermission?: string;
  featureFlag?: string;
  items?: NavigationItem[]; // Nested navigation support
}

export interface WorkspaceItem {
  id: string;
  name: string;
  details?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UserMenuProps {
  user?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onPreferencesClick?: () => void;
}

export interface WorkspaceSwitcherProps {
  currentWorkspace?: WorkspaceItem;
  workspaces?: WorkspaceItem[];
  onChange?: (workspaceId: string) => void;
  disabled?: boolean;
}

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "constrained" | "wide" | "fluid";
}

export interface BreadcrumbBarProps {
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export interface SidebarItemProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed?: boolean;
  onNavigate?: (href: string) => void;
}

export interface SidebarSectionProps {
  heading?: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
}

export interface AppSidebarProps {
  logo?: React.ReactNode;
  orgName?: string;
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  currentWorkspace?: WorkspaceItem;
  workspaces?: WorkspaceItem[];
  onWorkspaceChange?: (workspaceId: string) => void;
  // Slots
  sidebarTop?: React.ReactNode;
  sidebarBottom?: React.ReactNode;
}

export interface MobileNavigationProps {
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
}

export interface AppHeaderProps {
  pageTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  user?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onPreferencesClick?: () => void;
  onSearchClick?: () => void;
  onCommandPaletteClick?: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onMobileMenuToggle?: () => void;
  // Slots
  headerStart?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerEnd?: React.ReactNode;
}

export interface AppShellProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
  layoutMode?: "dashboard" | "standard" | "table" | "full-width";
  onLayoutModeChange?: (mode: "dashboard" | "standard" | "table" | "full-width") => void;
  // Sidebar State Details
  sidebarCollapsed?: boolean;
  onSidebarCollapseChange?: (collapsed: boolean) => void;
  // User Profile details
  user?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onPreferencesClick?: () => void;
  // Workspace switcher details
  currentWorkspace?: WorkspaceItem;
  workspaces?: WorkspaceItem[];
  onWorkspaceChange?: (workspaceId: string) => void;
  // Header details
  pageTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onSearchClick?: () => void;
  onCommandPaletteClick?: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  // Slots
  headerStart?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerEnd?: React.ReactNode;
  sidebarTop?: React.ReactNode;
  sidebarBottom?: React.ReactNode;
  contentTop?: React.ReactNode;
  contentBottom?: React.ReactNode;
}
