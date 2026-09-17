import { z } from 'zod';

const experienceSchema = z.object({
  _id: z.string().optional(),
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().trim().max(2000).optional().default(''),
});

const educationSchema = z.object({
  _id: z.string().optional(),
  degree: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const projectSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional().default(''),
  link: z.string().trim().url().optional().or(z.literal('')),
});

export const updateCandidateProfileSchema = z.object({
  phone: z.string().trim().max(30).optional(),
  location: z.string().trim().max(150).optional(),
  summary: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1)).max(50).optional(),
  experience: z.array(experienceSchema).max(30).optional(),
  education: z.array(educationSchema).max(30).optional(),
  projects: z.array(projectSchema).max(30).optional(),
  certifications: z.array(z.string().trim().min(1)).max(30).optional(),
  portfolio: z.string().trim().url().optional().or(z.literal('')),
  github: z.string().trim().url().optional().or(z.literal('')),
  linkedin: z.string().trim().url().optional().or(z.literal('')),
});
