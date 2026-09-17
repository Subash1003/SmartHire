import { Router } from 'express';
import * as aiController from '../../controllers/aiController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate } from '../../middleware/validateMiddleware.js';
import { aiLimiter } from '../../middleware/rateLimiters.js';
import { resumeScreenSchema } from '../../validators/ai.schema.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter', 'admin'));

router.post('/resume-screen', aiLimiter, verifyCsrf, validate(resumeScreenSchema), aiController.runResumeScreen);
router.get('/screenings/:applicationId', aiController.getScreening);

export default router;
