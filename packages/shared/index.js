// Role names (must match DB / seedRolesAndPermissions)
export const ROLES = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  WORKER: "Worker",
  MANAGER: "Manager",
};

// Permission names (must match DB / seedRolesAndPermissions)
export const PERMISSIONS = {
  // Users
  USERS_CREATE: "users:create",
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  // Projects
  PROJECTS_CREATE: "projects:create",
  PROJECTS_READ: "projects:read",
  PROJECTS_UPDATE: "projects:update",
  PROJECTS_DELETE: "projects:delete",

  // Attendance
  ATTENDANCE_CLOCK_IN: "attendance:clockIn",
  ATTENDANCE_CLOCK_OUT: "attendance:clockOut",
  ATTENDANCE_READ_OWN: "attendance:readOwn",
  ATTENDANCE_READ_ALL: "attendance:readAll",
  ATTENDANCE_UPDATE: "attendance:update",

  // Supervisor: view/edit people in my projects
  PROJECT_MEMBERS_READ: "projectMembers:read",
  PROJECT_MEMBERS_UPDATE: "projectMembers:update",

  // Reports
  REPORTS_READ: "reports:read",
  REPORTS_EXPORT: "reports:export",

  // Expenses
  EXPENSES_CREATE: "expenses:create",
  EXPENSES_READ_OWN: "expenses:readOwn",
  EXPENSES_READ_ALL: "expenses:readAll",
  EXPENSES_UPDATE: "expenses:update",
  EXPENSES_DELETE: "expenses:delete",
  EXPENSES_APPROVE: "expenses:approve",

  // Revenue
  REVENUE_CREATE: "revenue:create",
  REVENUE_READ: "revenue:read",
  REVENUE_UPDATE: "revenue:update",
  REVENUE_DELETE: "revenue:delete",

  // Roles
  ROLES_CREATE: "roles:create",
  ROLES_READ: "roles:read",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",

  // System
  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_LOGS: "system:logs",
};

// User categories for reporting (must match User model enum)
export const USER_CATEGORIES = [
  "Carpenter",
  "Electrician",
  "Finance",
  "Admin",
  "Other",
];

// Change request status (must match AttendanceChangeRequest model enum)
export const CHANGE_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SAR", "QAR"];

export const REVENUE_CATEGORIES = [
  "Contract Payment",
  "Milestone Payment",
  "Advance Payment",
  "Retention Release",
  "Other",
];

export const REVENUE_STATUS = ["Draft", "Invoiced", "Received", "Void"];

// Re-export all Zod validation schemas
export {
  loginSchema,
  signupSchema,
  registerSchema,
  clockInSchema,
  clockOutSchema,
  sheetMarkSchema,
  sheetMarksBulkSchema,
  attendanceMetadataSchema,
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  addProjectMembersBulkSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createRevenueSchema,
  updateRevenueSchema,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  updateOrganizationSettingsSchema,
} from "./schemas.js";
