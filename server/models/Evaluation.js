import mongoose from 'mongoose';

export const EVALUATION_RECOMMENDATIONS = ['select', 'hold', 'reject'];

const ratingField = { type: Number, required: true, min: 1, max: 10 };

const evaluationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, unique: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    technicalSkills: ratingField,
    problemSolving: ratingField,
    communication: ratingField,
    roleKnowledge: ratingField,
    codingSkills: ratingField,
    overallRating: ratingField,
    recommendation: { type: String, enum: EVALUATION_RECOMMENDATIONS, required: true },
    feedback: { type: String, default: '', trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

export default mongoose.model('Evaluation', evaluationSchema);
