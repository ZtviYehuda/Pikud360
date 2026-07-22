export const EMPLOYEES_BASE_ENDPOINT = "/employees"; // Use for GET list and POST create
export const EMPLOYEES_STRUCTURE_ENDPOINT = "/employees/structure";
export const EMPLOYEES_SERVICE_TYPES_ENDPOINT = "/employees/service-types";
export const EMPLOYEES_ROLES_ENDPOINT = "/employees/roles";
export const EMPLOYEES_EXPORT_ENDPOINT = "/employees/export";

// Helper for dynamic IDs
export const getEmployeeByIdEndpoint = (id: number) => `/employees/${id}`;
export const updateEmployeeEndpoint = (id: number) => `/employees/${id}`;
export const deleteEmployeeEndpoint = (id: number) => `/employees/${id}`;
export const markBirthdaySentEndpoint = (id: number) =>
  `/employees/${id}/birthday-sent`;
export const EMPLOYEES_PREFERENCES_ENDPOINT = "/employees/preferences";
export const EMPLOYEES_CANCEL_DELEGATION_ENDPOINT =
  "/employees/delegation/cancel";
