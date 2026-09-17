import { z } from 'zod';

export const applyFormSchema = z.object({
  coverLetter: z.string().trim().optional().or(z.literal('')),
  expectedSalary: z.union([z.string().length(0), z.coerce.number().min(0)]).optional(),
  availability: z.string().trim().optional().or(z.literal('')),
});
