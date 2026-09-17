import mongoose from 'mongoose';

const aiScreeningSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    experienceMatch: { type: Number, required: true, min: 0, max: 100 },
    educationMatch: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, default: '' },
    model: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('AIScreening', aiScreeningSchema);
