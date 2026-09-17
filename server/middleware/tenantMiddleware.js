import { ApiError } from '../utils/ApiError.js';

// Confirms a loaded resource belongs to the authenticated user's organization.
// Used from controllers in later phases once org-scoped resources (jobs,
// applications, interviews, ...) exist. Never trust a client-supplied
// organizationId — always compare against req.user.organizationId.
export function assertSameOrganization(req, resourceOrganizationId) {
  if (!resourceOrganizationId || resourceOrganizationId.toString() !== req.user.organizationId.toString()) {
    throw new ApiError(404, 'Resource not found');
  }
}
