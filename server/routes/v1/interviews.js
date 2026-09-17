import { Router } from 'express';
import * as interviewController from '../../controllers/interviewController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate, validateQuery } from '../../middleware/validateMiddleware.js';
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
  updateInterviewStatusSchema,
  listInterviewsQuerySchema,
} from '../../validators/interview.schema.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter', 'admin', 'interviewer'));

router.post('/', requireRole('recruiter', 'admin'), verifyCsrf, validate(scheduleInterviewSchema), interviewController.scheduleInterview);
router.get('/', validateQuery(listInterviewsQuerySchema), interviewController.listInterviews);
router.get('/:id', interviewController.getInterview);
router.put(
  '/:id',
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(updateInterviewSchema),
  interviewController.updateInterview
);
router.patch(
  '/:id/status',
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(updateInterviewStatusSchema),
  interviewController.updateInterviewStatus
);

export default router;
