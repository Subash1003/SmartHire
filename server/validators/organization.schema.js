import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150).optional(),
  logo: z.string().trim().url('Logo must be a valid URL').optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional(),
  website: z.string().trim().url('Website must be a valid URL').optional().or(z.literal('')),
  industry: z.string().trim().max(100).optional(),
  location: z.string().trim().max(150).optional(),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
});
