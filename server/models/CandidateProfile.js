import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    url: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    uploadedAt: { type: Date },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [String], default: [] },
    portfolio: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    resume: { type: resumeSchema, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('CandidateProfile', candidateProfileSchema);
