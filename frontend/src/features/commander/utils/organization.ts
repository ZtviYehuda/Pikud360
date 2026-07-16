import { OrganizationUnit } from '../../../types';

/**
 * Finds a unit node in the recursive organization tree by its ID.
 */
export function findUnitById(nodes: OrganizationUnit[], id: string): OrganizationUnit | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findUnitById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Retrieves the display name of a unit in the tree by its ID.
 */
export function findUnitName(nodes: OrganizationUnit[], id: string): string | null {
  const node = findUnitById(nodes, id);
  return node ? node.name : null;
}

/**
 * Builds the breadcrumbs path from the tree roots to the target unit ID.
 */
export function buildBreadcrumbs(
  nodes: OrganizationUnit[],
  targetId: string
): { id: string; name: string }[] {
  if (nodes.length === 0) return [];
  const path: { id: string; name: string }[] = [];

  function search(list: OrganizationUnit[], target: string): boolean {
    for (const n of list) {
      if (n.id === target) {
        path.push({ id: n.id, name: n.name });
        return true;
      }
      if (n.children && n.children.length > 0 && search(n.children, target)) {
        path.unshift({ id: n.id, name: n.name });
        return true;
      }
    }
    return false;
  }

  search(nodes, targetId);
  return path;
}

/**
 * Finds the parent unit of a target unit ID in the recursive organization tree.
 */
export function findParentUnit(nodes: OrganizationUnit[], targetId: string): OrganizationUnit | null {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      // Check if targetId is an immediate child
      if (node.children.some(child => child.id === targetId)) {
        return node;
      }
      const parent = findParentUnit(node.children, targetId);
      if (parent) return parent;
    }
  }
  return null;
}

/**
 * Maps the unit code or structure attributes to its translated category label.
 */
export function getUnitTypeLabel(node: OrganizationUnit | null, t: any): string {
  if (!node) return t('organization:type_hq');
  const code = (node.code || '').toUpperCase();
  if (code.includes('BRIGADE') || code.includes('BGD')) return t('organization:type_brigade');
  if (code.includes('BATTALION') || code.includes('BTN') || code.includes('GDUD')) return t('organization:type_battalion');
  if (code.includes('COMPANY') || code.includes('CO') || code.includes('PLUGA')) return t('organization:type_company');
  if (code.includes('PLATOON') || code.includes('PLT') || code.includes('MACHLAKA')) return t('organization:type_platoon');
  return t('organization:type_hq');
}
