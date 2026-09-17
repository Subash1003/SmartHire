import { Router } from 'express';
import * as evaluationController from '../../controllers/evaluationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate } from '../../middleware/validateMiddleware.js';
import { createEvaluationSchema, updateEvaluationSchema } from '../../validators/evaluation.schema.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter', 'admin', 'interviewer'));

router.post('/', requireRole('interviewer'), verifyCsrf, validate(createEvaluationSchema), evaluationController.createEvaluation);
router.get('/interview/:interviewId', evaluationController.getEvaluationForInterview);
router.put('/:id', requireRole('interviewer'), verifyCsrf, validate(updateEvaluationSchema), evaluationController.updateEvaluation);

export default router;
