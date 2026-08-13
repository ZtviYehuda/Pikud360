export const EMPLOYEES_BASE_ENDPOINT = "/employees"; // Use for GET list and POST create
export const EMPLOYEES_STRUCTURE_ENDPOINT = "/employees/structure";
export const EMPLOYEES_SERVICE_TYPES_ENDPOINT = "/employees/service-types";
export const EMPLOYEES_ROLES_ENDPOINT = "/employees/roles";
export const EMPLOYEES_EXPORT_ENDPOINT = "/employees/export";

// Helper for dynamic IDs
const sanitizeId = (id: number | string) => {
  if (id === undefined || id === null || id === "" || id === "NaN" || String(id) === "NaN") {
    return "0";
  }
  return id;
};

export const getEmployeeByIdEndpoint = (id: number | string) => `/employees/${sanitizeId(id)}`;
export const updateEmployeeEndpoint = (id: number | string) => `/employees/${sanitizeId(id)}`;
export const deleteEmployeeEndpoint = (id: number | string) => `/employees/${sanitizeId(id)}`;
export const markBirthdaySentEndpoint = (id: number | string) =>
  `/employees/${sanitizeId(id)}/birthday-sent`;
export const EMPLOYEES_PREFERENCES_ENDPOINT = "/employees/preferences";
export const EMPLOYEES_CANCEL_DELEGATION_ENDPOINT =
  "/employees/delegation/cancel";
