import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import Interview from '../models/Interview.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';
import { findOrgScopedApplication } from './applicationController.js';

async function findOwnedInterview(req, interviewId) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw new ApiError(404, 'Interview not found');
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  assertSameOrganization(req, interview.organizationId);

  if (!interview.interviewerId.equals(req.user._id)) {
    throw new ApiError(403, 'You can only submit an evaluation for your own assigned interviews');
  }

  return interview;
}

export const createEvaluation = asyncHandler(async (req, res) => {
  const { interviewId, ...ratings } = req.body;
  const interview = await findOwnedInterview(req, interviewId);

  const existing = await Evaluation.findOne({ interviewId });
  if (existing) {
    throw new ApiError(409, 'An evaluation has already been submitted for this interview');
  }

  const evaluation = await Evaluation.create({
    organizationId: req.user.organizationId,
    interviewId,
    interviewerId: req.user._id,
    ...ratings,
  });

  if (interview.status !== 'cancelled') {
    interview.status = 'completed';
    await interview.save();
  }

  sendSuccess(res, { statusCode: 201, message: 'Evaluation submitted successfully', data: { evaluation } });
});

export const getEvaluationForInterview = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  if (!mongoose.isValidObjectId(interviewId)) {
    throw new ApiError(404, 'Interview not found');
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
  assertSameOrganization(req, interview.organizationId);

  if (req.user.role === 'interviewer' && !interview.interviewerId.equals(req.user._id)) {
    throw new ApiError(404, 'Evaluation not found');
  }

  const evaluation = await Evaluation.findOne({ interviewId }).populate('interviewerId', 'name');
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  sendSuccess(res, { message: 'Evaluation retrieved successfully', data: { evaluation } });
});

export const updateEvaluation = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Evaluation not found');
  }

  const evaluation = await Evaluation.findById(req.params.id);
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  assertSameOrganization(req, evaluation.organizationId);

  if (!evaluation.interviewerId.equals(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own evaluation');
  }

  Object.assign(evaluation, req.body);
  await evaluation.save();

  sendSuccess(res, { message: 'Evaluation updated successfully', data: { evaluation } });
});

export const listEvaluationsForApplication = asyncHandler(async (req, res) => {
  const application = await findOrgScopedApplication(req);

  const interviews = await Interview.find({ applicationId: application._id }).select('_id type round startTime');
  const interviewIds = interviews.map((i) => i._id);

  const evaluations = await Evaluation.find({ interviewId: { $in: interviewIds } })
    .populate('interviewerId', 'name')
    .sort({ createdAt: -1 });

  const interviewsById = Object.fromEntries(interviews.map((i) => [i._id.toString(), i]));
  const enriched = evaluations.map((evaluation) => ({
    ...evaluation.toObject(),
    interview: interviewsById[evaluation.interviewId.toString()],
  }));

  sendSuccess(res, { message: 'Evaluations retrieved successfully', data: { evaluations: enriched } });
});
