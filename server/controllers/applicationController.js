import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import CandidateProfile from '../models/CandidateProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';

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
  });

  sendSuccess(res, { statusCode: 201, message: 'Application submitted successfully', data: { application } });
});

export const listApplications = asyncHandler(async (req, res) => {
  const { jobId, status } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);

  const filter = {};
  if (req.user.role === 'candidate') {
    filter.candidateId = req.user._id;
  } else {
    filter.organizationId = req.user.organizationId;
    if (jobId) filter.jobId = jobId;
  }
  if (status) filter.status = status;

  const result = await paginate(Application, filter, pagination, {
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
    .populate('candidateId', 'name email');

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  const isOwner = application.candidateId._id.equals(req.user._id);
  const isOrgStaff =
    req.user.role !== 'candidate' && application.organizationId.equals(req.user.organizationId);

  if (!isOwner && !isOrgStaff) {
    throw new ApiError(404, 'Application not found');
  }

  sendSuccess(res, { message: 'Application retrieved successfully', data: { application } });
});
