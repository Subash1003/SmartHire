import { z } from 'zod';
import { APPLICATION_STATUSES } from '../models/Application.js';

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  coverLetter: z.string().trim().max(5000).optional().or(z.literal('')),
  expectedSalary: z.coerce.number().min(0).optional().nullable(),
  availability: z.string().trim().max(200).optional().or(z.literal('')),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  jobId: z.string().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
});
