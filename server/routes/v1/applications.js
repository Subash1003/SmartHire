import { Router } from 'express';
import * as applicationController from '../../controllers/applicationController.js';
import * as noteController from '../../controllers/noteController.js';
import * as evaluationController from '../../controllers/evaluationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate, validateQuery } from '../../middleware/validateMiddleware.js';
import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
  makeDecisionSchema,
} from '../../validators/application.schema.js';
import { createNoteSchema } from '../../validators/note.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('candidate'), verifyCsrf, validate(createApplicationSchema), applicationController.createApplication);
router.get('/', requireRole('candidate', 'recruiter', 'admin'), validateQuery(listApplicationsQuerySchema), applicationController.listApplications);
router.get('/:id', requireRole('candidate', 'recruiter', 'admin', 'interviewer'), applicationController.getApplication);
router.patch(
  '/:id/status',
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);
router.post(
  '/:id/decision',
  requireRole('recruiter', 'admin'),
  verifyCsrf,
  validate(makeDecisionSchema),
  applicationController.makeDecision
);

router.get('/:id/notes', requireRole('recruiter', 'admin'), noteController.listNotes);
router.post('/:id/notes', requireRole('recruiter', 'admin'), verifyCsrf, validate(createNoteSchema), noteController.createNote);

router.get('/:id/evaluations', requireRole('recruiter', 'admin'), evaluationController.listEvaluationsForApplication);

export default router;
