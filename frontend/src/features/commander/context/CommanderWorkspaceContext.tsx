import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { OrganizationUnit } from '../../../types';

export interface CommanderWorkspaceContextType {
  // Domain State (Raw Domain Models only, no UI/presentation states)
  orgTree: OrganizationUnit[];
  selectedUnitId: string;

  // Semantic Workspace Actions
  selectOrganizationUnit: (unitId: string) => void;
  clearSelection: () => void;
  resetWorkspace: () => void;
}

const CommanderWorkspaceContext = createContext<CommanderWorkspaceContextType | undefined>(undefined);

export function CommanderWorkspaceProvider({ 
  children,
  orgTree
}: { 
  children: ReactNode;
  orgTree: OrganizationUnit[];
}) {
  const { user } = useAuthStore();
  
  // Resolve user's unit ID from user auth context
  const userOrgUnitId = (user as any)?.orgUnitId || (user as any)?.organization_unit_id || '';

  // Initialize selectedUnitId with user's context ID or empty if not loaded yet
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => userOrgUnitId);

  // Dynamic initialization fallback: when orgTree loads and selectedUnitId is empty, use root unit
  useEffect(() => {
    if (!selectedUnitId && orgTree && orgTree.length > 0) {
      const rootId = userOrgUnitId || orgTree[0]?.id;
      if (rootId) {
        setSelectedUnitId(rootId);
      }
    }
  }, [orgTree, userOrgUnitId, selectedUnitId]);

  // Semantic actions
  const selectOrganizationUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
  };

  const clearSelection = () => {
    // Reset to user's unit ID context or fallback to root unit of the tree
    const defaultId = userOrgUnitId || (orgTree && orgTree[0]?.id) || '';
    setSelectedUnitId(defaultId);
  };

  const resetWorkspace = () => {
    const defaultId = userOrgUnitId || (orgTree && orgTree[0]?.id) || '';
    setSelectedUnitId(defaultId);
  };

  return (
    <CommanderWorkspaceContext.Provider value={{
      orgTree,
      selectedUnitId,
      selectOrganizationUnit,
      clearSelection,
      resetWorkspace
    }}>
      {children}
    </CommanderWorkspaceContext.Provider>
  );
}

export function useCommanderWorkspace() {
  const context = useContext(CommanderWorkspaceContext);
  if (!context) {
    throw new Error('useCommanderWorkspace must be used within a CommanderWorkspaceProvider');
  }
  return context;
}
