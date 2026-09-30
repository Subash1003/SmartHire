import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Evaluation from '../models/Evaluation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const SCREENING_ONWARD = ['under_review', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected'];
const SHORTLISTED_ONWARD = ['shortlisted', 'interview_scheduled', 'interview_completed', 'selected'];

export const getOverview = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [totalJobs, activeJobs, totalApplications, shortlisted, interviews, selectedApplications] = await Promise.all([
    Job.countDocuments({ organizationId }),
    Job.countDocuments({ organizationId, status: 'published' }),
    Application.countDocuments({ organizationId }),
    Application.countDocuments({ organizationId, status: 'shortlisted' }),
    Interview.countDocuments({ organizationId }),
    Application.find({ organizationId, status: 'selected', decision: { $ne: null } }).select('appliedAt decision.madeAt'),
  ]);

  let averageTimeToHireDays = null;
  if (selectedApplications.length > 0) {
    const totalDays = selectedApplications.reduce((sum, app) => {
      const days = (app.decision.madeAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageTimeToHireDays = Math.round((totalDays / selectedApplications.length) * 10) / 10;
  }

  sendSuccess(res, {
    message: 'Analytics overview retrieved successfully',
    data: {
      totalJobs,
      activeJobs,
      totalApplications,
      shortlisted,
      interviews,
      selected: selectedApplications.length,
      averageTimeToHireDays,
    },
  });
});

export const getApplicationAnalytics = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [trendRaw, pipelineRaw, byJobRaw] = await Promise.all([
    Application.aggregate([
      { $match: { organizationId, appliedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$appliedAt' }, month: { $month: '$appliedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Application.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { _id: 0, jobId: '$_id', title: '$job.title', count: 1 } },
    ]),
  ]);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trend = trendRaw.map((entry) => ({
    month: `${MONTH_NAMES[entry._id.month - 1]} ${entry._id.year}`,
    count: entry.count,
  }));

  const pipeline = pipelineRaw.map((entry) => ({ status: entry._id, count: entry.count }));

  sendSuccess(res, {
    message: 'Application analytics retrieved successfully',
    data: { trend, pipeline, byJob: byJobRaw },
  });
});

export const getHiringFunnel = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [applications, screening, shortlisted, selected, interviewedApplicationIds] = await Promise.all([
    Application.countDocuments({ organizationId }),
    Application.countDocuments({ organizationId, 'statusHistory.status': { $in: SCREENING_ONWARD } }),
    Application.countDocuments({ organizationId, 'statusHistory.status': { $in: SHORTLISTED_ONWARD } }),
    Application.countDocuments({ organizationId, status: 'selected' }),
    Interview.distinct('applicationId', { organizationId }),
  ]);

  sendSuccess(res, {
    message: 'Hiring funnel retrieved successfully',
    data: {
      funnel: [
        { stage: 'Applications', count: applications },
        { stage: 'Screening', count: screening },
        { stage: 'Shortlisted', count: shortlisted },
        { stage: 'Interview', count: interviewedApplicationIds.length },
        { stage: 'Selected', count: selected },
      ],
    },
  });
});

export const getInterviewAnalytics = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [scheduled, completed, completedInterviewIds, evaluatedInterviewIds, avgResult] = await Promise.all([
    Interview.countDocuments({ organizationId, status: 'scheduled' }),
    Interview.countDocuments({ organizationId, status: 'completed' }),
    Interview.find({ organizationId, status: 'completed' }).distinct('_id'),
    Evaluation.distinct('interviewId', { organizationId }),
    Evaluation.aggregate([
      { $match: { organizationId } },
      { $group: { _id: null, avg: { $avg: '$overallRating' } } },
    ]),
  ]);

  const evaluatedSet = new Set(evaluatedInterviewIds.map((id) => id.toString()));
  const pendingEvaluations = completedInterviewIds.filter((id) => !evaluatedSet.has(id.toString())).length;
  const averageInterviewScore = avgResult.length > 0 ? Math.round(avgResult[0].avg * 10) / 10 : null;

  sendSuccess(res, {
    message: 'Interview analytics retrieved successfully',
    data: { scheduled, completed, pendingEvaluations, averageInterviewScore },
  });
});
