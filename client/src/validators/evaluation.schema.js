import { z } from 'zod';

const rating = z.coerce.number().int().min(1, 'Must be 1-10').max(10, 'Must be 1-10');

export const evaluationFormSchema = z.object({
  technicalSkills: rating,
  problemSolving: rating,
  communication: rating,
  roleKnowledge: rating,
  codingSkills: rating,
  overallRating: rating,
  recommendation: z.enum(['select', 'hold', 'reject']),
  feedback: z.string().trim().optional().or(z.literal('')),
});

export const RECOMMENDATION_OPTIONS = [
  { value: 'select', label: 'Select' },
  { value: 'hold', label: 'Hold' },
  { value: 'reject', label: 'Reject' },
];

export const RECOMMENDATION_LABELS = {
  select: 'Select',
  hold: 'Hold',
  reject: 'Reject',
};

export const RECOMMENDATION_VARIANT = {
  select: 'success',
  hold: 'warning',
  reject: 'danger',
};
