// Shared constants — single source of truth lives in @buildflow/shared
export {
  ROLES,
  PERMISSIONS,
  CURRENCIES,
  USER_CATEGORIES,
  CHANGE_REQUEST_STATUS,
  REVENUE_CATEGORIES,
  REVENUE_STATUS,
} from "@buildflow/shared";

// Attendance mark statuses (daily sheet: Present / Absent / Partial)
export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  PARTIAL: "PARTIAL",
};

export const ATTENDANCE_STATUSES = [
  { _id: ATTENDANCE_STATUS.PRESENT, name: "Present" },
  { _id: ATTENDANCE_STATUS.PARTIAL, name: "Partial" },
  { _id: ATTENDANCE_STATUS.ABSENT, name: "Absent" },
];

// Options for daily sheet dropdown (with short labels)
export const ATTENDANCE_STATUS_OPTIONS_SHEET = [
  { _id: ATTENDANCE_STATUS.PRESENT, name: "Present (P)" },
  { _id: ATTENDANCE_STATUS.ABSENT, name: "Absent (A)" },
  { _id: ATTENDANCE_STATUS.PARTIAL, name: "Partial" },
];

// Attendance record status (clock in/out: Active vs Done)
export const RECORD_STATUS = {
  CLOCKED_IN: "CLOCKED_IN",
  CLOCKED_OUT: "CLOCKED_OUT",
};

export const CHANGE_REQUEST_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

// Report type (Reports page: user cost vs project report vs P&L)
export const REPORT_TYPE = {
  USER: "user",
  PROJECT: "project",
  PROFIT_LOSS: "profitLoss",
};

export const REPORT_TYPE_OPTIONS = [
  {
    value: REPORT_TYPE.USER,
    label: "User cost report",
    description: "Cost for a specific user",
  },
  {
    value: REPORT_TYPE.PROJECT,
    label: "Project Report",
    description: "Attendance summary by project",
  },
  {
    value: REPORT_TYPE.PROFIT_LOSS,
    label: "Profit & Loss",
    description: "Revenue vs expenses per project",
  },
];

// Date range presets
export const DATE_PRESETS = {
  today: () => {
    const today = new Date().toISOString().split("T")[0];
    return { startDate: today, endDate: today, label: "Today" };
  },
  yesterday: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split("T")[0];
    return { startDate: date, endDate: date, label: "Yesterday" };
  },
  last7Days: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      label: "Last 7 days",
    };
  },
  last30Days: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      label: "Last 30 days",
    };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      label: "This month",
    };
  },
  lastMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      label: "Last month",
    };
  },
};

// Get date preset options as array for select dropdown
export const getDatePresetOptions = () => [
  { id: "today", ...DATE_PRESETS.today() },
  { id: "yesterday", ...DATE_PRESETS.yesterday() },
  { id: "last7Days", ...DATE_PRESETS.last7Days() },
  { id: "last30Days", ...DATE_PRESETS.last30Days() },
  { id: "thisMonth", ...DATE_PRESETS.thisMonth() },
  { id: "lastMonth", ...DATE_PRESETS.lastMonth() },
];

// Pagination: must match backend (backend max page size is 20). Always send page + limit for table APIs.
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20],
};
