import { z } from 'zod';
import { INTERVIEW_TYPES, INTERVIEW_STATUSES } from '../models/Interview.js';

const baseFields = {
  type: z.enum(INTERVIEW_TYPES),
  round: z.coerce.number().int().min(1).max(20).optional(),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  meetingLink: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
};

function withTimeOrderCheck(schema) {
  return schema.refine((data) => data.startTime.getTime() < data.endTime.getTime(), {
    message: 'End time must be after start time',
    path: ['endTime'],
  });
}

export const scheduleInterviewSchema = withTimeOrderCheck(
  z.object({
    applicationId: z.string().min(1, 'Application is required'),
    interviewerId: z.string().min(1, 'Interviewer is required'),
    ...baseFields,
  })
);

export const updateInterviewSchema = withTimeOrderCheck(
  z.object({
    interviewerId: z.string().min(1, 'Interviewer is required'),
    ...baseFields,
  })
);

export const updateInterviewStatusSchema = z.object({
  status: z.enum(INTERVIEW_STATUSES),
});

export const listInterviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(INTERVIEW_STATUSES).optional(),
  interviewerId: z.string().optional(),
});
