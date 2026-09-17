import { Router } from 'express';
import * as applicationController from '../../controllers/applicationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate, validateQuery } from '../../middleware/validateMiddleware.js';
import { createApplicationSchema, listApplicationsQuerySchema } from '../../validators/application.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('candidate'), verifyCsrf, validate(createApplicationSchema), applicationController.createApplication);
router.get('/', requireRole('candidate', 'recruiter', 'admin'), validateQuery(listApplicationsQuerySchema), applicationController.listApplications);
router.get('/:id', requireRole('candidate', 'recruiter', 'admin'), applicationController.getApplication);

export default router;
