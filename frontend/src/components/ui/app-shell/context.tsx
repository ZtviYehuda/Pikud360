import * as React from "react";
import { useResponsiveLayout } from "./hooks";

export type LayoutMode = "dashboard" | "standard" | "table" | "full-width";

export interface AppShellContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isMobile: boolean;
}

const AppShellContext = React.createContext<AppShellContextType | undefined>(undefined);

export const AppShellProvider: React.FC<{
  children: React.ReactNode;
  initialCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  initialLayoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
}> = ({
  children,
  initialCollapsed = false,
  onCollapseChange,
  initialLayoutMode = "standard",
  onLayoutModeChange,
}) => {
  const { isMobile } = useResponsiveLayout();
  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState(initialCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [layoutMode, setLayoutModeState] = React.useState<LayoutMode>(initialLayoutMode);

  // Sync props collapsing state
  React.useEffect(() => {
    setSidebarCollapsedState(initialCollapsed);
  }, [initialCollapsed]);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    onCollapseChange?.(collapsed);
  };

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    onLayoutModeChange?.(mode);
  };

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        layoutMode,
        setLayoutMode,
        isMobile,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
};

export const useAppShellContext = () => {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShellContext must be used within an AppShellProvider");
  }
  return context;
};
