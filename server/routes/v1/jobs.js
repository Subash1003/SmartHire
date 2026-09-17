import { Router } from 'express';
import * as jobController from '../../controllers/jobController.js';
import { requireAuth, optionalAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate, validateQuery } from '../../middleware/validateMiddleware.js';
import { createJobSchema, updateJobSchema, updateJobStatusSchema, listJobsQuerySchema } from '../../validators/job.schema.js';

const router = Router();

router.get('/', optionalAuth, validateQuery(listJobsQuerySchema), jobController.listJobs);
router.get('/:id', optionalAuth, jobController.getJob);

router.post(
  '/',
  requireAuth,
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(createJobSchema),
  jobController.createJob
);
router.put(
  '/:id',
  requireAuth,
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(updateJobSchema),
  jobController.updateJob
);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(updateJobStatusSchema),
  jobController.updateJobStatus
);

export default router;
