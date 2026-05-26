import { z } from "zod";
import {
  USER_CATEGORIES,
  CURRENCIES,
  REVENUE_CATEGORIES,
  REVENUE_STATUS,
} from "./index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Mongo ObjectId-shaped string (24 hex chars) */
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID");

/** Latitude (-90 to 90) */
const latitude = z
  .number({ required_error: "Latitude is required", invalid_type_error: "Latitude must be a number" })
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

/** Longitude (-180 to 180) */
const longitude = z
  .number({ required_error: "Longitude is required", invalid_type_error: "Longitude must be a number" })
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

/** Coordinates object (lat + lng) */
const coordinates = z.object({
  lat: latitude,
  lng: longitude,
});

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required"),
  organizationSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .optional(),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Please provide a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Please provide a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
  category: z
    .enum(USER_CATEGORIES, {
      errorMap: () => ({
        message: `Category must be one of: ${USER_CATEGORIES.join(", ")}`,
      }),
    })
    .optional(),
});

// ─── Attendance Schemas ─────────────────────────────────────────────────────

export const clockInSchema = z.object({
  projectId: z.string().optional(),
  coordinates,
});

export const clockOutSchema = z.object({
  coordinates,
  metadata: z
    .object({
      workUnits: z.number({ invalid_type_error: "Work units must be a number" }).optional(),
      workType: z.string({ invalid_type_error: "Work type must be a string" }).optional(),
      extraSiteExpenses: z
        .number({ invalid_type_error: "Extra site expenses must be a number" })
        .optional(),
    })
    .optional(),
});

const attendanceStatus = z.enum(["PRESENT", "ABSENT", "PARTIAL"], {
  errorMap: () => ({
    message: "Status must be PRESENT, ABSENT, or PARTIAL",
  }),
});

export const sheetMarkSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().min(1, "Date is required"),
  projectId: z.string().min(1, "Project ID is required"),
  status: attendanceStatus,
  hoursWorked: z
    .number({ invalid_type_error: "Hours worked must be a number" })
    .optional(),
});

export const sheetMarksBulkSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  date: z.string().min(1, "Date is required"),
  entries: z
    .array(
      z.object({
        userId: z.string().min(1, "Each entry must have userId"),
        status: attendanceStatus,
        hoursWorked: z
          .number({ invalid_type_error: "hoursWorked must be a number" })
          .optional(),
      }),
    )
    .max(200, "Entries cannot exceed 200"),
});

export const attendanceMetadataSchema = z.object({
  metadata: z
    .object({
      workUnits: z.number({ invalid_type_error: "Work units must be a number" }).optional(),
      workType: z.string({ invalid_type_error: "Work type must be a string" }).optional(),
      extraSiteExpenses: z
        .number({ invalid_type_error: "Extra site expenses must be a number" })
        .optional(),
    })
    .optional(),
});

// ─── Project Schemas ────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  location: z.object({
    lat: z
      .number({ invalid_type_error: "Valid latitude is required" })
      .min(-90, "Valid latitude is required")
      .max(90, "Valid latitude is required"),
    lng: z
      .number({ invalid_type_error: "Valid longitude is required" })
      .min(-180, "Valid longitude is required")
      .max(180, "Valid longitude is required"),
  }),
  radius: z
    .number({ invalid_type_error: "Radius must be a positive number" })
    .min(1, "Radius must be a positive number")
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  minWorkHours: z.number().min(0).max(24).optional(),
});

export const addProjectMembersBulkSchema = z.object({
  userIds: z
    .array(mongoId.pipe(z.string({ message: "Each userId must be a valid ID" })))
    .min(1, "userIds must be an array"),
});

// ─── Expense Schemas ────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "Materials",
  "Equipment",
  "Transport",
  "Subsistence",
  "Other",
];

const EXPENSE_STATUS = ["Draft", "Submitted", "Approved", "Rejected", "Void"];

export const createExpenseSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a positive number" })
    .min(0, "Amount must be a positive number"),
  currency: z.string().trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${EXPENSE_CATEGORIES.join(", ")}`,
    }),
  }),
  description: z.string().trim().optional(),
  date: z.string().datetime({ offset: true, message: "Valid date required" }).optional(),
  status: z.enum(EXPENSE_STATUS).optional(),
  vendor: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ─── Revenue Schemas ────────────────────────────────────────────────────────

export const createRevenueSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a positive number" })
    .min(0, "Amount must be a positive number"),
  currency: z.string().trim().optional(),
  category: z.enum(REVENUE_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${REVENUE_CATEGORIES.join(", ")}`,
    }),
  }),
  description: z.string().trim().optional(),
  date: z.string().datetime({ offset: true, message: "Valid date required" }).optional(),
  status: z.enum(REVENUE_STATUS).optional(),
  clientName: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
});

export const updateRevenueSchema = createRevenueSchema.partial();

// ─── Role Schemas ───────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
  permissions: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

// ─── Organization Settings Schema ───────────────────────────────────────────

export const updateOrganizationSettingsSchema = z.object({
  general: z
    .object({
      currency: z
        .enum(CURRENCIES, {
          errorMap: () => ({
            message: `Currency must be one of: ${CURRENCIES.join(", ")}`,
          }),
        })
        .optional(),
      displayName: z.string().trim().optional(),
    })
    .optional(),
  expenses: z
    .object({
      categories: z
        .array(z.string().trim().min(1))
        .min(1, "At least one expense category is required")
        .optional(),
    })
    .optional(),
});
