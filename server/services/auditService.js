import AuditLog from '../models/AuditLog.js';

// Best-effort, like notificationService: a logging failure must never break
// the action being logged.
export async function createAuditLog({
  organizationId,
  actorId,
  action,
  resourceType,
  resourceId,
  previousValue = null,
  newValue = null,
}) {
  try {
    await AuditLog.create({ organizationId, actorId, action, resourceType, resourceId, previousValue, newValue });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
}
