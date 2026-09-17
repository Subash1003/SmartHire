import { Router } from 'express';
import * as organizationController from '../../controllers/organizationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate } from '../../middleware/validateMiddleware.js';
import { updateOrganizationSchema } from '../../validators/organization.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/me', organizationController.getMyOrganization);
router.put(
  '/me',
  verifyCsrf,
  requireRole('admin'),
  validate(updateOrganizationSchema),
  organizationController.updateMyOrganization
);

export default router;
