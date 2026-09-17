import { z } from 'zod';

export const resumeScreenSchema = z.object({
  applicationId: z.string().min(1, 'Application is required'),
});
