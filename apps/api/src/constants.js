// Re-export shared constants so existing relative imports throughout the API continue to work.
export {
  ROLES,
  PERMISSIONS,
  USER_CATEGORIES,
  CHANGE_REQUEST_STATUS,
  CURRENCIES,
  REVENUE_CATEGORIES,
  REVENUE_STATUS,
} from "@buildflow/shared";

// Auth-related messages (backend-only)
export const AUTH_MESSAGES = {
  NO_TOKEN: "Not authorized, no token provided",
  USER_NOT_FOUND: "Not authorized, user not found",
  USER_DEACTIVATED: "User account is deactivated",
  TOKEN_INVALID: "Not authorized, token invalid",
  ROLE_NOT_AUTHORIZED: (roleName) =>
    `Role '${roleName}' is not authorized to access this resource`,
  PERMISSION_DENIED: (permission) =>
    `You don't have permission to perform this action (required: ${permission})`,
  PERMISSION_DENIED_ANY: "You don't have permission to perform this action",
};

// Organization settings (backend-only)
export const DEFAULT_ORG_SETTINGS = {
  general: {
    currency: "USD",
    displayName: "",
  },
  expenses: {
    categories: ["Materials", "Equipment", "Transport", "Subsistence", "Other"],
  },
};
