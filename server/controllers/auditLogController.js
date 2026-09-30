import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, resourceType, actorId, dateFrom, dateTo } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);

  const filter = { organizationId: req.user.organizationId };
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (actorId) filter.actorId = actorId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  const result = await paginate(AuditLog, filter, pagination, {
    sort: { createdAt: -1 },
    populate: [{ path: 'actorId', select: 'name email role' }],
  });

  sendSuccess(res, { message: 'Audit logs retrieved successfully', data: result.data, pagination: result.pagination });
});
