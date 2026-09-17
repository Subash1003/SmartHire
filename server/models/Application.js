import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'interview_completed',
  'selected',
  'rejected',
  'on_hold',
];

const resumeSnapshotSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['selected', 'rejected', 'on_hold'], required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    madeAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeSnapshot: { type: resumeSnapshotSchema, required: true },
    coverLetter: { type: String, default: '' },
    expectedSalary: { type: Number, default: null },
    availability: { type: String, default: '' },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied', index: true },
    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
    decision: { type: decisionSchema, default: null },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Application', applicationSchema);
