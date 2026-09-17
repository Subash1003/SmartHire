import { z } from 'zod';

const emptyOrUrl = z.string().trim().url('Must be a valid URL').optional().or(z.literal(''));

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  logo: emptyOrUrl,
  description: z.string().trim().optional().or(z.literal('')),
  website: emptyOrUrl,
  industry: z.string().trim().optional().or(z.literal('')),
  location: z.string().trim().optional().or(z.literal('')),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
});
