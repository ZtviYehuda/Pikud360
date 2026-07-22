export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  roles: string[];
  unitId?: string;
}
