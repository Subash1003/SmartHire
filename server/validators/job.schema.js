import { z } from 'zod';
import { EMPLOYMENT_TYPES, WORK_MODES, JOB_STATUSES } from '../models/Job.js';

export const createJobSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
    department: z.string().trim().max(100).optional().or(z.literal('')),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    responsibilities: z.array(z.string().trim().min(1)).max(30).optional(),
    requiredSkills: z.array(z.string().trim().min(1)).max(30).optional(),
    preferredSkills: z.array(z.string().trim().min(1)).max(30).optional(),
    education: z.string().trim().max(200).optional().or(z.literal('')),
    experience: z.string().trim().max(100).optional().or(z.literal('')),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    workMode: z.enum(WORK_MODES),
    location: z.string().trim().max(150).optional().or(z.literal('')),
    salaryMin: z.coerce.number().min(0).optional().nullable(),
    salaryMax: z.coerce.number().min(0).optional().nullable(),
    deadline: z.coerce.date().optional().nullable(),
  })
  .refine((data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax, {
    message: 'Minimum salary must not exceed maximum salary',
    path: ['salaryMin'],
  });

export const updateJobSchema = createJobSchema;

export const updateJobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(100).optional(),
  skills: z.string().trim().max(200).optional(),
  location: z.string().trim().max(150).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  status: z.enum(JOB_STATUSES).optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
});
