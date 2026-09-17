import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import AIScreening from '../models/AIScreening.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';
import { extractText } from '../services/resumeService.js';
import { screenResume } from '../services/aiService.js';

export const runResumeScreen = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(404, 'Application not found');
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  assertSameOrganization(req, application.organizationId);

  const job = await Job.findById(application.jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const resumeText = await extractText(application.resumeSnapshot.url, application.resumeSnapshot.fileType);

  if (!resumeText || !resumeText.trim()) {
    throw new ApiError(422, 'Unable to read any text from this resume file.');
  }

  const result = await screenResume({ job, resumeText });

  const screening = await AIScreening.findOneAndUpdate(
    { applicationId: application._id },
    {
      organizationId: application.organizationId,
      applicationId: application._id,
      jobId: job._id,
      candidateId: application.candidateId,
      ...result,
    },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );

  sendSuccess(res, { statusCode: 201, message: 'Resume screening completed successfully', data: { screening } });
});

export const getScreening = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(404, 'Screening not found');
  }

  const screening = await AIScreening.findOne({ applicationId });
  if (!screening) {
    throw new ApiError(404, 'Screening not found');
  }
  assertSameOrganization(req, screening.organizationId);

  sendSuccess(res, { message: 'Screening retrieved successfully', data: { screening } });
});
