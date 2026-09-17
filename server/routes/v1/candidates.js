import { Router } from 'express';
import * as candidateProfileController from '../../controllers/candidateProfileController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate } from '../../middleware/validateMiddleware.js';
import { updateCandidateProfileSchema } from '../../validators/candidateProfile.schema.js';

const router = Router();

router.use(requireAuth, requireRole('candidate'));

router.get('/profile', candidateProfileController.getMyProfile);
router.put('/profile', verifyCsrf, validate(updateCandidateProfileSchema), candidateProfileController.updateMyProfile);

export default router;
