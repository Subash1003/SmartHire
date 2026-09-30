import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import CandidateProfile from '../models/CandidateProfile.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';
import { createNotification } from '../services/notificationService.js';
import {
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
  sendApplicationDecisionEmail,
} from '../services/emailService.js';
import { createAuditLog } from '../services/auditService.js';

export const createApplication = asyncHandler(async (req, res) => {
  const { jobId, coverLetter, expectedSalary, availability } = req.body;

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(404, 'Job not found');
  }

  const job = await Job.findById(jobId);
  if (!job || job.status !== 'published') {
    throw new ApiError(404, 'Job not found');
  }

  const profile = await CandidateProfile.findOne({ userId: req.user._id });
  if (!profile?.resume?.url) {
    throw new ApiError(400, 'Please upload a resume to your profile before applying');
  }

  const existing = await Application.findOne({ jobId, candidateId: req.user._id });
  if (existing) {
    throw new ApiError(409, 'You have already applied to this job');
  }

  const application = await Application.create({
    organizationId: job.organizationId,
    jobId: job._id,
    candidateId: req.user._id,
    resumeSnapshot: {
      url: profile.resume.url,
      fileName: profile.resume.fileName,
      fileType: profile.resume.fileType,
      fileSize: profile.resume.fileSize,
    },
    coverLetter,
    expectedSalary,
    availability,
    statusHistory: [{ status: 'applied', changedBy: req.user._id }],
  });

  await createNotification({
    organizationId: job.organizationId,
    recipientId: job.createdBy,
    type: 'new_application',
    title: 'New application received',
    message: `${req.user.name} applied for ${job.title}`,
    resourceType: 'application',
    resourceId: application._id,
  });
  await sendApplicationConfirmationEmail(req.user, job);

  await createAuditLog({
    organizationId: job.organizationId,
    actorId: req.user._id,
    action: 'application_submitted',
    resourceType: 'application',
    resourceId: application._id,
    newValue: { jobId: job._id, status: application.status },
  });

  sendSuccess(res, { statusCode: 201, message: 'Application submitted successfully', data: { application } });
});

function buildBaseFilter(req, { jobId, status, dateFrom, dateTo }) {
  const filter = {};

  if (req.user.role === 'candidate') {
    filter.candidateId = req.user._id;
  } else {
    filter.organizationId = req.user.organizationId;
    if (jobId) filter.jobId = new mongoose.Types.ObjectId(jobId);
  }

  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.appliedAt = {};
    if (dateFrom) filter.appliedAt.$gte = dateFrom;
    if (dateTo) filter.appliedAt.$lte = dateTo;
  }

  return filter;
}

async function listViaAggregation(filter, { page, limit, skip }, { department, search, sort }) {
  const pipeline = [
    { $match: filter },
    { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'jobId' } },
    { $unwind: '$jobId' },
    { $lookup: { from: 'users', localField: 'candidateId', foreignField: '_id', as: 'candidateId' } },
    { $unwind: '$candidateId' },
  ];

  if (department) {
    pipeline.push({ $match: { 'jobId.department': { $regex: department, $options: 'i' } } });
  }

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'candidateId.name': { $regex: search, $options: 'i' } },
          { 'candidateId.email': { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  const sortStage =
    sort === 'oldest'
      ? { appliedAt: 1 }
      : sort === 'name_asc'
        ? { 'candidateId.name': 1 }
        : sort === 'name_desc'
          ? { 'candidateId.name': -1 }
          : { appliedAt: -1 };

  pipeline.push({ $sort: sortStage });
  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            organizationId: 1,
            jobId: { _id: 1, title: 1, department: 1, location: 1, employmentType: 1, workMode: 1 },
            candidateId: { _id: 1, name: 1, email: 1 },
            resumeSnapshot: 1,
            coverLetter: 1,
            expectedSalary: 1,
            availability: 1,
            status: 1,
            appliedAt: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await Application.aggregate(pipeline);
  const data = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export const listApplications = asyncHandler(async (req, res) => {
  const { jobId, status, department, search, sort, dateFrom, dateTo } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);
  const filter = buildBaseFilter(req, { jobId, status, dateFrom, dateTo });

  const needsAggregation = Boolean(department || search || sort === 'name_asc' || sort === 'name_desc');

  const result = needsAggregation
    ? await listViaAggregation(filter, pagination, { department, search, sort })
    : await paginate(Application, filter, pagination, {
        sort: sort === 'oldest' ? { appliedAt: 1 } : { appliedAt: -1 },
        populate: [
          { path: 'jobId', select: 'title department location employmentType workMode' },
          { path: 'candidateId', select: 'name email' },
        ],
      });

  sendSuccess(res, { message: 'Applications retrieved successfully', data: result.data, pagination: result.pagination });
});

export const getApplication = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Application not found');
  }

  const application = await Application.findById(req.params.id)
    .populate('jobId', 'title department location employmentType workMode organizationId')
    .populate('candidateId', 'name email')
    .populate('statusHistory.changedBy', 'name');

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  const isOwner = application.candidateId._id.equals(req.user._id);
  const isOrgStaff =
    ['recruiter', 'admin'].includes(req.user.role) && application.organizationId.equals(req.user.organizationId);

  let isAssignedInterviewer = false;
  if (req.user.role === 'interviewer' && application.organizationId.equals(req.user.organizationId)) {
    isAssignedInterviewer = Boolean(
      await Interview.exists({ applicationId: application._id, interviewerId: req.user._id })
    );
  }

  if (!isOwner && !isOrgStaff && !isAssignedInterviewer) {
    throw new ApiError(404, 'Application not found');
  }

  sendSuccess(res, { message: 'Application retrieved successfully', data: { application } });
});

export async function findOrgScopedApplication(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Application not found');
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  assertSameOrganization(req, application.organizationId);
  return application;
}

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await findOrgScopedApplication(req);
  const { status } = req.body;
  const previousStatus = application.status;

  application.status = status;
  application.statusHistory.push({ status, changedBy: req.user._id });
  await application.save();

  const [candidate, job] = await Promise.all([
    User.findById(application.candidateId),
    Job.findById(application.jobId),
  ]);
  await createNotification({
    organizationId: application.organizationId,
    recipientId: application.candidateId,
    type: 'application_status_changed',
    title: 'Application status updated',
    message: `Your application for ${job.title} is now: ${status}`,
    resourceType: 'application',
    resourceId: application._id,
  });
  await sendApplicationStatusEmail(candidate, job, status);

  await createAuditLog({
    organizationId: application.organizationId,
    actorId: req.user._id,
    action: 'application_status_changed',
    resourceType: 'application',
    resourceId: application._id,
    previousValue: { status: previousStatus },
    newValue: { status },
  });

  sendSuccess(res, { message: 'Application status updated successfully', data: { application } });
});

export const makeDecision = asyncHandler(async (req, res) => {
  const application = await findOrgScopedApplication(req);
  const { status, notes } = req.body;
  const previousStatus = application.status;

  application.status = status;
  application.statusHistory.push({ status, changedBy: req.user._id });
  application.decision = { status, madeBy: req.user._id, madeAt: new Date(), notes: notes || '' };
  await application.save();

  const populated = await application.populate('decision.madeBy', 'name');

  const [candidate, job] = await Promise.all([
    User.findById(application.candidateId),
    Job.findById(application.jobId),
  ]);
  await createNotification({
    organizationId: application.organizationId,
    recipientId: application.candidateId,
    type: 'application_decision',
    title: 'A decision has been made on your application',
    message: `Your application for ${job.title}: ${status}`,
    resourceType: 'application',
    resourceId: application._id,
  });
  await sendApplicationDecisionEmail(candidate, job, status);

  await createAuditLog({
    organizationId: application.organizationId,
    actorId: req.user._id,
    action: 'hiring_decision_made',
    resourceType: 'application',
    resourceId: application._id,
    previousValue: { status: previousStatus },
    newValue: { status, notes: notes || '' },
  });

  sendSuccess(res, { message: 'Hiring decision recorded successfully', data: { application: populated } });
});
