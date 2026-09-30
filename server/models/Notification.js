import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'application_submitted',
  'application_status_changed',
  'application_decision',
  'new_application',
  'interview_scheduled',
  'interview_rescheduled',
  'interview_cancelled',
  'interview_assigned',
  'interview_updated',
  'evaluation_submitted',
];

const notificationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedResource: {
      resourceType: { type: String, enum: ['application', 'interview', 'evaluation'], default: null },
      resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
