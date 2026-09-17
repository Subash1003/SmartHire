import { z } from 'zod';

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

export const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters'),
    department: z.string().trim().optional().or(z.literal('')),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    responsibilitiesText: z.string().trim().optional().or(z.literal('')),
    requiredSkillsText: z.string().trim().optional().or(z.literal('')),
    preferredSkillsText: z.string().trim().optional().or(z.literal('')),
    education: z.string().trim().optional().or(z.literal('')),
    experience: z.string().trim().optional().or(z.literal('')),
    employmentType: z.enum(['full-time', 'part-time', 'internship', 'contract']),
    workMode: z.enum(['remote', 'hybrid', 'on-site']),
    location: z.string().trim().optional().or(z.literal('')),
    salaryMin: z.union([z.string().length(0), z.coerce.number().min(0)]).optional(),
    salaryMax: z.union([z.string().length(0), z.coerce.number().min(0)]).optional(),
    deadline: z.string().trim().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.salaryMin || !data.salaryMax) return true;
      return Number(data.salaryMin) <= Number(data.salaryMax);
    },
    { message: 'Minimum salary must not exceed maximum salary', path: ['salaryMin'] }
  );

function splitToArray(text) {
  return text
    ? text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

export function toJobPayload(values) {
  const { responsibilitiesText, requiredSkillsText, preferredSkillsText, salaryMin, salaryMax, deadline, ...rest } = values;

  return {
    ...rest,
    responsibilities: splitToArray(responsibilitiesText),
    requiredSkills: splitToArray(requiredSkillsText),
    preferredSkills: splitToArray(preferredSkillsText),
    salaryMin: salaryMin ? Number(salaryMin) : null,
    salaryMax: salaryMax ? Number(salaryMax) : null,
    deadline: deadline || null,
  };
}

export function fromJob(job) {
  return {
    title: job.title || '',
    department: job.department || '',
    description: job.description || '',
    responsibilitiesText: (job.responsibilities || []).join(', '),
    requiredSkillsText: (job.requiredSkills || []).join(', '),
    preferredSkillsText: (job.preferredSkills || []).join(', '),
    education: job.education || '',
    experience: job.experience || '',
    employmentType: job.employmentType || 'full-time',
    workMode: job.workMode || 'remote',
    location: job.location || '',
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    deadline: job.deadline ? job.deadline.substring(0, 10) : '',
  };
}
