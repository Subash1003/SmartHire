import { z } from 'zod';

const emptyOrUrl = z.string().trim().url('Must be a valid URL').optional().or(z.literal(''));

export const updateCandidateProfileSchema = z.object({
  phone: z.string().trim().optional().or(z.literal('')),
  location: z.string().trim().optional().or(z.literal('')),
  summary: z.string().trim().optional().or(z.literal('')),
  skillsText: z.string().trim().optional().or(z.literal('')),
  portfolio: emptyOrUrl,
  github: emptyOrUrl,
  linkedin: emptyOrUrl,
});
