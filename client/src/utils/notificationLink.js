// Resolves where clicking a notification should navigate to, based on the
// resource it's about and the viewer's role. Some (resourceType, role)
// combinations have no dedicated detail page yet (e.g. candidates can't view
// a single interview) — those fall back to the closest list page instead of
// doing nothing.
export function getNotificationLink(notification, role) {
  const { resourceType, resourceId } = notification.relatedResource || {};
  if (!resourceType || !resourceId) return null;

  if (resourceType === 'application') {
    if (role === 'candidate') return `/candidate/applications/${resourceId}`;
    if (role === 'recruiter') return `/recruiter/applications/${resourceId}`;
  }

  if (resourceType === 'interview') {
    if (role === 'interviewer') return `/interviewer/interviews/${resourceId}`;
    if (role === 'recruiter') return '/recruiter/interviews';
    if (role === 'candidate') return '/candidate/applications';
  }

  if (resourceType === 'evaluation') {
    if (role === 'recruiter') return '/recruiter/applications';
  }

  return null;
}
