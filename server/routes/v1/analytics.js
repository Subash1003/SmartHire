import { Router } from 'express';
import * as analyticsController from '../../controllers/analyticsController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter', 'admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/applications', analyticsController.getApplicationAnalytics);
router.get('/hiring-funnel', analyticsController.getHiringFunnel);
router.get('/interviews', analyticsController.getInterviewAnalytics);

export default router;
