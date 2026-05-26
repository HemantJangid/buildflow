/**
 * Unit tests for exportReport controller (profit-loss type).
 *
 * Models and logger are mocked so no real MongoDB connection is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies before importing the controller
// ---------------------------------------------------------------------------

vi.mock("../models/Revenue.js", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../models/Expense.js", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../models/Project.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("../models/Attendance.js", () => ({
  default: { aggregate: vi.fn(), find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../models/OrganizationMember.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../models/User.js", () => ({
  default: { findById: vi.fn(), find: vi.fn() },
}));
vi.mock("../utils/logger.js", () => ({
  default: { error: vi.fn(), info: vi.fn() },
}));

import Revenue from "../models/Revenue.js";
import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import { exportReport } from "./reportController.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock req object.
 */
function makeReq(query = {}) {
  return {
    query,
    user: {
      id: "user-1",
      organizationId: "org-1",
      role: { name: "Admin" },
      permissions: ["reports:export"],
    },
  };
}

/**
 * Build a mock res object that captures headers and body.
 */
function makeRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    send(body) {
      this._body = body;
      return this;
    },
    setHeader(key, value) {
      this._headers[key] = value;
    },
  };
  return res;
}

/**
 * Default mock data — two projects.
 */
function setupDefaultMocks() {
  Revenue.aggregate.mockResolvedValue([
    { _id: "proj-1", revenue: 10000 },
    { _id: "proj-2", revenue: 5000 },
  ]);
  Expense.aggregate.mockResolvedValue([
    { _id: "proj-1", expenses: 4000 },
    { _id: "proj-2", expenses: 6000 },
  ]);
  Project.find.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([
      { _id: "proj-1", name: "Alpha Project" },
      { _id: "proj-2", name: "Beta Project" },
    ]),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("exportReport controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when type is missing", async () => {
    const req = makeReq({});
    const res = makeRes();

    await exportReport(req, res);

    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toMatch(/invalid report type/i);
  });

  it("returns 400 when type is an unknown value", async () => {
    const req = makeReq({ type: "unknown-type" });
    const res = makeRes();

    await exportReport(req, res);

    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it("streams CSV with status 200 for profit-loss with no date range", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    expect(res._status).toBe(200);
    expect(res._headers["Content-Type"]).toBe("text/csv");
  });

  it("sets Content-Disposition header with attachment and correct filename (no date range)", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    const disposition = res._headers["Content-Disposition"];
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/buildflow-profit-loss-all-/);
    expect(disposition).toMatch(/\.csv/);
  });

  it("sets Content-Disposition filename with startDate and endDate when provided", async () => {
    setupDefaultMocks();

    const req = makeReq({
      type: "profit-loss",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });
    const res = makeRes();

    await exportReport(req, res);

    const disposition = res._headers["Content-Disposition"];
    expect(disposition).toContain("buildflow-profit-loss-2024-01-01-2024-03-31.csv");
  });

  it("CSV contains a TOTALS row in the header section", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    expect(res._body).toContain("TOTALS");
  });

  it("CSV contains per-project breakdown rows (PROJECT section)", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    expect(res._body).toContain("PROJECT");
    expect(res._body).toContain("Alpha Project");
    expect(res._body).toContain("Beta Project");
  });

  it("CSV sections are separated by a blank row", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    // A blank row appears as two consecutive newlines in the CSV
    expect(res._body).toMatch(/\n\n/);
  });

  it("CSV header row contains expected column names", async () => {
    setupDefaultMocks();

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    const firstLine = res._body.split("\n")[0];
    expect(firstLine).toContain("section");
    expect(firstLine).toContain("project");
    expect(firstLine).toContain("revenue");
    expect(firstLine).toContain("expenses");
    expect(firstLine).toContain("net_profit");
    expect(firstLine).toContain("margin_pct");
  });

  it("escapes commas in project names correctly", async () => {
    Revenue.aggregate.mockResolvedValue([
      { _id: "proj-comma", revenue: 1000 },
    ]);
    Expense.aggregate.mockResolvedValue([]);
    Project.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: "proj-comma", name: "Project, With Comma" },
      ]),
    });

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    // The project name should be wrapped in double-quotes
    expect(res._body).toContain('"Project, With Comma"');
  });

  it("escapes double-quotes in project names correctly", async () => {
    Revenue.aggregate.mockResolvedValue([
      { _id: "proj-quote", revenue: 2000 },
    ]);
    Expense.aggregate.mockResolvedValue([]);
    Project.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: "proj-quote", name: 'Project "Alpha"' },
      ]),
    });

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    // Double-quotes inside a field must be escaped as ""
    expect(res._body).toContain('"Project ""Alpha"""');
  });

  it("totals row has correct revenue and expense sums", async () => {
    Revenue.aggregate.mockResolvedValue([
      { _id: "p1", revenue: 1000 },
      { _id: "p2", revenue: 2000 },
    ]);
    Expense.aggregate.mockResolvedValue([
      { _id: "p1", expenses: 500 },
    ]);
    Project.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: "p1", name: "P1" },
        { _id: "p2", name: "P2" },
      ]),
    });

    const req = makeReq({ type: "profit-loss" });
    const res = makeRes();

    await exportReport(req, res);

    // Total revenue = 3000, expenses = 500, net = 2500
    expect(res._body).toContain("3000");
    expect(res._body).toContain("500");
    expect(res._body).toContain("2500");
  });
});
