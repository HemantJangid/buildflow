import { PERMISSIONS, ROLES } from "../constants.js";
import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import logger from "../utils/logger.js";
import { getPagination, paginatedResponse } from "../utils/pagination.js";

/**
 * Get allowed project IDs for current user (Admin = all org projects, else = assigned only).
 * Cached per request so multiple handlers do not re-query.
 */
async function getAllowedProjectIds(req) {
  if (req._allowedProjectIds !== undefined) {
    return req._allowedProjectIds;
  }
  const organizationId = req.user.organizationId;
  let ids;
  if (req.user.role?.name === ROLES.ADMIN) {
    ids = await Project.find({ organizationId }).distinct("_id");
    req._allowedProjectIds = ids.map((id) => id.toString());
  } else {
    const memberships = await ProjectMember.find({
      userId: req.user.id,
      organizationId,
      isActive: true,
    }).select("projectId");
    req._allowedProjectIds = [
      ...new Set(memberships.map((m) => m.projectId.toString())),
    ];
  }
  return req._allowedProjectIds;
}

/**
 * @desc    Get all expenses (paginated)
 * @route   GET /api/expenses?page=1&limit=10&projectId=&startDate=&endDate=&category=&status=&submittedBy=
 * @access  Private (expenses:readOwn or expenses:readAll)
 */
export const getAllExpenses = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { page, limit, skip } = getPagination(req.query, 10);
    const { projectId, startDate, endDate, category, status, submittedBy } =
      req.query;

    const projectIds = await getAllowedProjectIds(req);
    if (projectIds.length === 0) {
      return paginatedResponse(res, { data: [], total: 0, page, limit });
    }

    const query = { organizationId, projectId: { $in: projectIds } };

    const hasReadAll = req.user.permissions?.includes(
      PERMISSIONS.EXPENSES_READ_ALL,
    );
    if (!hasReadAll) {
      query.submittedBy = req.user.id;
    }

    if (projectId) query.projectId = projectId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (submittedBy) query.submittedBy = submittedBy;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("projectId", "name")
        .populate("submittedBy", "name email")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(query),
    ]);

    return paginatedResponse(res, { data: expenses, total, page, limit });
  } catch (error) {
    logger.error("Get expenses error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single expense
 * @route   GET /api/expenses/:id
 * @access  Private
 */
export const getExpense = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);

    const expense = await Expense.findOne({
      _id: req.params.id,
      organizationId,
      projectId: { $in: projectIds },
    })
      .populate("projectId", "name")
      .populate("submittedBy", "name email")
      .populate("approvedBy", "name")
      .lean();

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    const hasReadAll = req.user.permissions?.includes(
      PERMISSIONS.EXPENSES_READ_ALL,
    );
    if (!hasReadAll && expense.submittedBy?._id?.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    return res.status(200).json({ success: true, data: expense });
  } catch (error) {
    logger.error("Get expense error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create expense
 * @route   POST /api/expenses
 * @access  Private (expenses:create)
 */
export const createExpense = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);
    const {
      projectId,
      amount,
      currency,
      category,
      description,
      date,
      status,
      vendor,
      receiptNumber,
    } = req.body;

    if (!projectIds.includes(projectId)) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const expense = await Expense.create({
      organizationId,
      projectId,
      submittedBy: req.user.id,
      amount: Number(amount),
      currency: currency || "USD",
      category,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      status: status || "Draft",
      vendor: vendor || "",
      receiptNumber: receiptNumber || "",
    });

    await expense.populate("projectId", "name");
    await expense.populate("submittedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    logger.error("Create expense error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private (expenses:update)
 */
export const updateExpense = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);
    const expense = await Expense.findOne({
      _id: req.params.id,
      organizationId,
      projectId: { $in: projectIds },
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    const hasReadAll = req.user.permissions?.includes(
      PERMISSIONS.EXPENSES_READ_ALL,
    );
    if (!hasReadAll && expense.submittedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only edit your own expenses",
        });
    }

    const {
      amount,
      currency,
      category,
      description,
      date,
      status,
      vendor,
      receiptNumber,
    } = req.body;
    if (amount != null) expense.amount = Number(amount);
    if (currency != null) expense.currency = currency;
    if (category != null) expense.category = category;
    if (description != null) expense.description = description;
    if (date != null) expense.date = new Date(date);
    if (status != null) expense.status = status;
    if (vendor != null) expense.vendor = vendor;
    if (receiptNumber != null) expense.receiptNumber = receiptNumber;

    await expense.save();
    await expense.populate("projectId", "name");
    await expense.populate("submittedBy", "name email");

    return res.status(200).json({ success: true, data: expense });
  } catch (error) {
    logger.error("Update expense error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private (expenses:delete)
 */
export const deleteExpense = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);

    const expense = await Expense.findOne({
      _id: req.params.id,
      organizationId,
      projectId: { $in: projectIds },
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    await Expense.findByIdAndDelete(expense._id);
    return res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    logger.error("Delete expense error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get expense summary (non-paginated) – aggregation-based
 * @route   GET /api/expenses/summary?groupBy=project|category|period|user&startDate=&endDate=&projectId=
 * @access  Private (expenses:readAll)
 */
export const getExpenseSummary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);
    if (projectIds.length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          data: { groups: [], totalAmount: 0, count: 0 },
        });
    }

    const { groupBy, startDate, endDate, projectId } = req.query;
    const key = groupBy || "project";

    const matchStage = { organizationId, projectId: { $in: projectIds } };
    if (projectId) matchStage.projectId = projectId;
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    let groupId;
    if (key === "project") groupId = "$projectId";
    else if (key === "category") groupId = { $ifNull: ["$category", "Other"] };
    else if (key === "user") groupId = "$submittedBy";
    else if (key === "period")
      groupId = { $dateToString: { format: "%Y-%m", date: "$date" } };
    else
      return res.status(200).json({
        success: true,
        data: { groups: [], totalAmount: 0, count: 0 },
      });

    const [totalsResult, groupsResult] = await Promise.all([
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupId,
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: key === "period" ? { _id: 1 } : { amount: -1 } },
      ]),
    ]);

    const totalAmount = totalsResult[0]?.totalAmount ?? 0;
    const count = totalsResult[0]?.count ?? 0;

    let groups = groupsResult.map((g) => ({
      id: g._id?.toString?.() ?? g._id,
      label: g._id?.toString?.() ?? g._id,
      amount: g.amount,
      count: g.count,
    }));

    if (key === "project" && groups.length > 0) {
      const Project = (await import("../models/Project.js")).default;
      const ids = groups.map((g) => g.id);
      const projects = await Project.find({ _id: { $in: ids } })
        .select("name")
        .lean();
      const nameMap = Object.fromEntries(
        projects.map((p) => [p._id.toString(), p.name || p._id.toString()]),
      );
      groups = groups.map((g) => ({ ...g, label: nameMap[g.id] || g.id }));
    } else if (key === "user" && groups.length > 0) {
      const User = (await import("../models/User.js")).default;
      const ids = groups.map((g) => g.id);
      const users = await User.find({ _id: { $in: ids } })
        .select("name")
        .lean();
      const nameMap = Object.fromEntries(
        users.map((u) => [u._id.toString(), u.name || u._id.toString()]),
      );
      groups = groups.map((g) => ({ ...g, label: nameMap[g.id] || g.id }));
    }
    // category and period: id already used as label

    return res.status(200).json({
      success: true,
      data: { groups, totalAmount, count },
    });
  } catch (error) {
    logger.error("Expense summary error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Export expenses as CSV (same filters as list)
 * @route   GET /api/expenses/export?format=csv&projectId=&startDate=&endDate=&...
 * @access  Private (expenses:readAll or reports:export)
 */
export const exportExpenses = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const projectIds = await getAllowedProjectIds(req);
    if (projectIds.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      return res
        .status(200)
        .send(
          "date,project,category,amount,currency,status,submittedBy,description\n",
        );
    }

    const hasReadAll = req.user.permissions?.includes(
      PERMISSIONS.EXPENSES_READ_ALL,
    );
    if (!hasReadAll) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    const { projectId, startDate, endDate, category, status } = req.query;
    const query = { organizationId, projectId: { $in: projectIds } };
    if (projectId) query.projectId = projectId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const expenses = await Expense.find(query)
      .populate("projectId", "name")
      .populate("submittedBy", "name email")
      .sort({ date: -1 })
      .limit(5000)
      .lean();

    const rows = expenses.map((e) => {
      const date = e.date ? new Date(e.date).toISOString().slice(0, 10) : "";
      const project = (e.projectId?.name || e.projectId || "")
        .toString()
        .replace(/"/g, '""');
      const submittedBy = (
        e.submittedBy?.name ||
        e.submittedBy?.email ||
        e.submittedBy ||
        ""
      )
        .toString()
        .replace(/"/g, '""');
      const desc = (e.description || "").toString().replace(/"/g, '""');
      return `"${date}","${project}","${e.category || ""}",${e.amount || 0},"${e.currency || "USD"}","${e.status || ""}","${submittedBy}","${desc}"`;
    });
    const csv =
      "date,project,category,amount,currency,status,submittedBy,description\n" +
      rows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    return res.status(200).send(csv);
  } catch (error) {
    logger.error("Export expenses error", { error: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};
