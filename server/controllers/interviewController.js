import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';

const POPULATE_FIELDS = [
  { path: 'applicationId', select: 'status' },
  { path: 'candidateId', select: 'name email' },
  { path: 'jobId', select: 'title department' },
  { path: 'interviewerId', select: 'name email' },
];

async function hasConflict({ interviewerId, startTime, endTime, excludeInterviewId }) {
  const filter = {
    interviewerId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeInterviewId) filter._id = { $ne: excludeInterviewId };

  const conflict = await Interview.findOne(filter);
  return Boolean(conflict);
}

async function assertValidInterviewer(organizationId, interviewerId) {
  if (!mongoose.isValidObjectId(interviewerId)) {
    throw new ApiError(400, 'Invalid interviewer');
  }

  const interviewer = await User.findOne({ _id: interviewerId, organizationId, role: 'interviewer', isActive: true });
  if (!interviewer) {
    throw new ApiError(400, 'Interviewer must be an active interviewer in your organization');
  }
}

export const scheduleInterview = asyncHandler(async (req, res) => {
  const { applicationId, interviewerId, type, round, date, startTime, endTime, meetingLink, notes } = req.body;

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(404, 'Application not found');
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  assertSameOrganization(req, application.organizationId);

  await assertValidInterviewer(req.user.organizationId, interviewerId);

  if (await hasConflict({ interviewerId, startTime, endTime })) {
    throw new ApiError(409, 'This interviewer already has an interview scheduled in that time slot');
  }

  const interview = await Interview.create({
    organizationId: req.user.organizationId,
    applicationId: application._id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    interviewerId,
    type,
    round: round || 1,
    date,
    startTime,
    endTime,
    meetingLink,
    notes,
    createdBy: req.user._id,
  });

  const populated = await interview.populate(POPULATE_FIELDS);

  sendSuccess(res, { statusCode: 201, message: 'Interview scheduled successfully', data: { interview: populated } });
});

export const listInterviews = asyncHandler(async (req, res) => {
  const { status, interviewerId } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);

  const filter = { organizationId: req.user.organizationId };

  if (req.user.role === 'interviewer') {
    filter.interviewerId = req.user._id;
  } else if (interviewerId) {
    filter.interviewerId = interviewerId;
  }

  if (status) filter.status = status;

  const result = await paginate(Interview, filter, pagination, {
    sort: { startTime: 1 },
    populate: POPULATE_FIELDS,
  });

  sendSuccess(res, { message: 'Interviews retrieved successfully', data: result.data, pagination: result.pagination });
});

async function findAccessibleInterview(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Interview not found');
  }

  const interview = await Interview.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  assertSameOrganization(req, interview.organizationId);

  if (req.user.role === 'interviewer' && !interview.interviewerId._id.equals(req.user._id)) {
    throw new ApiError(404, 'Interview not found');
  }

  return interview;
}

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await findAccessibleInterview(req);
  sendSuccess(res, { message: 'Interview retrieved successfully', data: { interview } });
});

export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await findAccessibleInterview(req);

  const { interviewerId, type, round, date, startTime, endTime, meetingLink, notes } = req.body;

  await assertValidInterviewer(req.user.organizationId, interviewerId);

  if (await hasConflict({ interviewerId, startTime, endTime, excludeInterviewId: interview._id })) {
    throw new ApiError(409, 'This interviewer already has an interview scheduled in that time slot');
  }

  interview.interviewerId = interviewerId;
  interview.type = type;
  interview.round = round || interview.round;
  interview.date = date;
  interview.startTime = startTime;
  interview.endTime = endTime;
  interview.meetingLink = meetingLink;
  interview.notes = notes;
  interview.status = 'scheduled';
  await interview.save();

  const populated = await interview.populate(POPULATE_FIELDS);
  sendSuccess(res, { message: 'Interview rescheduled successfully', data: { interview: populated } });
});

export const updateInterviewStatus = asyncHandler(async (req, res) => {
  const interview = await findAccessibleInterview(req);

  interview.status = req.body.status;
  await interview.save();

  const populated = await interview.populate(POPULATE_FIELDS);
  sendSuccess(res, { message: 'Interview status updated successfully', data: { interview: populated } });
});
