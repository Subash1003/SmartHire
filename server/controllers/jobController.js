import mongoose from 'mongoose';
import Job from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';
import { createAuditLog } from '../services/auditService.js';

const STAFF_ROLES = ['recruiter', 'admin'];

function isStaffViewer(req) {
  return req.user && STAFF_ROLES.includes(req.user.role);
}

// Escapes regex metacharacters so search text (which may contain them, e.g.
// "C++") is matched literally instead of being interpreted as a pattern.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_TRANSITIONS = {
  draft: ['published', 'closed'],
  published: ['closed', 'expired'],
  closed: [],
  expired: ['published', 'closed'],
};

function buildFilter(req) {
  const { search, skills, location, employmentType, workMode, status } = req.validatedQuery;
  const filter = {};

  if (isStaffViewer(req)) {
    filter.organizationId = req.user.organizationId;
    if (status) filter.status = status;
  } else {
    filter.status = 'published';
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }, { requiredSkills: searchRegex }];
  }
  if (skills) {
    const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillList.length) {
      filter.requiredSkills = { $in: skillList.map((s) => new RegExp(`^${s}$`, 'i')) };
    }
  }
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (employmentType) filter.employmentType = employmentType;
  if (workMode) filter.workMode = workMode;

  return filter;
}

export const listJobs = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.validatedQuery);
  const filter = buildFilter(req);
  const { sort } = req.validatedQuery;

  const sortOption = { createdAt: sort === 'oldest' ? 1 : -1 };

  const result = await paginate(Job, filter, pagination, { sort: sortOption });

  sendSuccess(res, { message: 'Jobs retrieved successfully', data: result.data, pagination: result.pagination });
});

export const getJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Job not found');
  }

  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.status !== 'published') {
    if (!isStaffViewer(req)) {
      throw new ApiError(404, 'Job not found');
    }
    assertSameOrganization(req, job.organizationId);
  }

  sendSuccess(res, { message: 'Job retrieved successfully', data: { job } });
});

export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({
    ...req.body,
    organizationId: req.user.organizationId,
    createdBy: req.user._id,
  });

  await createAuditLog({
    organizationId: req.user.organizationId,
    actorId: req.user._id,
    action: 'job_created',
    resourceType: 'job',
    resourceId: job._id,
    newValue: { title: job.title, status: job.status },
  });

  sendSuccess(res, { statusCode: 201, message: 'Job created successfully', data: { job } });
});

async function findOwnedJob(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Job not found');
  }

  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  assertSameOrganization(req, job.organizationId);

  if (req.user.role !== 'admin' && !job.createdBy.equals(req.user._id)) {
    throw new ApiError(403, 'Only the job owner or an admin can modify this job');
  }

  return job;
}

export const updateJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req);

  Object.assign(job, req.body);
  await job.save();

  sendSuccess(res, { message: 'Job updated successfully', data: { job } });
});

const STATUS_CHANGE_ACTIONS = {
  published: 'job_published',
  closed: 'job_closed',
};

export const updateJobStatus = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req);
  const { status: nextStatus } = req.body;

  const allowed = VALID_TRANSITIONS[job.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot change job status from "${job.status}" to "${nextStatus}"`);
  }

  const previousStatus = job.status;
  job.status = nextStatus;
  await job.save();

  await createAuditLog({
    organizationId: req.user.organizationId,
    actorId: req.user._id,
    action: STATUS_CHANGE_ACTIONS[nextStatus] || 'job_status_changed',
    resourceType: 'job',
    resourceId: job._id,
    previousValue: { status: previousStatus },
    newValue: { status: nextStatus },
  });

  sendSuccess(res, { message: 'Job status updated successfully', data: { job } });
});
