import { z } from 'zod';
import { EVALUATION_RECOMMENDATIONS } from '../models/Evaluation.js';

const rating = z.coerce.number().int().min(1).max(10);

const ratingFields = {
  technicalSkills: rating,
  problemSolving: rating,
  communication: rating,
  roleKnowledge: rating,
  codingSkills: rating,
  overallRating: rating,
  recommendation: z.enum(EVALUATION_RECOMMENDATIONS),
  feedback: z.string().trim().max(4000).optional().or(z.literal('')),
};

export const createEvaluationSchema = z.object({
  interviewId: z.string().min(1, 'Interview is required'),
  ...ratingFields,
});

export const updateEvaluationSchema = z.object(ratingFields);
