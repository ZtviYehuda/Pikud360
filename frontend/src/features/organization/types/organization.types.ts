export interface TeamNode {
  id: number;
  name: string;
  section_id: number;
  commander_id?: number;
  commander_name?: string;
  headcount?: number;
}

export interface SectionNode {
  id: number;
  name: string;
  department_id: number;
  teams: TeamNode[];
  commander_id?: number;
  commander_name?: string;
  headcount?: number;
}

export interface DepartmentNode {
  id: number;
  name: string;
  sections: SectionNode[];
  commander_id?: number;
  commander_name?: string;
  headcount?: number;
}

export interface OrganizationStructureResponse {
  departments: DepartmentNode[];
}
