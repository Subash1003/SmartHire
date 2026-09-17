import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);
