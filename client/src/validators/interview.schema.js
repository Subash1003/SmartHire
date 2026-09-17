import { z } from 'zod';

export const interviewFormSchema = z
  .object({
    interviewerId: z.string().min(1, 'Interviewer is required'),
    type: z.enum(['technical', 'hr', 'managerial', 'behavioral', 'final']),
    round: z.union([z.string().length(0), z.coerce.number().int().min(1)]).optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    meetingLink: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().trim().optional().or(z.literal('')),
  })
  .refine((data) => new Date(data.startTime).getTime() < new Date(data.endTime).getTime(), {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export function toInterviewPayload(values) {
  const startTime = new Date(values.startTime);
  const endTime = new Date(values.endTime);

  return {
    interviewerId: values.interviewerId,
    type: values.type,
    round: values.round ? Number(values.round) : 1,
    date: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()).toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    meetingLink: values.meetingLink || '',
    notes: values.notes || '',
  };
}

function toLocalDateTimeInputValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInterview(interview) {
  return {
    interviewerId: interview.interviewerId?._id || interview.interviewerId || '',
    type: interview.type,
    round: interview.round,
    startTime: toLocalDateTimeInputValue(interview.startTime),
    endTime: toLocalDateTimeInputValue(interview.endTime),
    meetingLink: interview.meetingLink || '',
    notes: interview.notes || '',
  };
}
