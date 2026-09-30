import Notification from '../models/Notification.js';

// Best-effort: a notification failing to save must never break the action
// that triggered it (applying to a job, scheduling an interview, ...).
export async function createNotification({
  organizationId,
  recipientId,
  type,
  title,
  message,
  resourceType = null,
  resourceId = null,
}) {
  try {
    await Notification.create({
      organizationId,
      recipientId,
      type,
      title,
      message,
      relatedResource: { resourceType, resourceId },
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}
