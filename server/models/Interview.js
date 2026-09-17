import mongoose from 'mongoose';

export const INTERVIEW_TYPES = ['technical', 'hr', 'managerial', 'behavioral', 'final'];
export const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];

const interviewSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: INTERVIEW_TYPES, required: true },
    round: { type: Number, required: true, min: 1, default: 1 },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: INTERVIEW_STATUSES, default: 'scheduled', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

interviewSchema.index({ interviewerId: 1, startTime: 1 });
interviewSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Interview', interviewSchema);
