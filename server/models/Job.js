import mongoose from 'mongoose';

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
export const WORK_MODES = ['remote', 'hybrid', 'on-site'];
export const JOB_STATUSES = ['draft', 'published', 'closed', 'expired'];

const jobSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: '' },
    description: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    workMode: { type: String, enum: WORK_MODES, required: true },
    location: { type: String, trim: true, default: '' },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    deadline: { type: Date, default: null },
    status: { type: String, enum: JOB_STATUSES, default: 'draft', index: true },
  },
  { timestamps: true }
);

jobSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Job', jobSchema);
