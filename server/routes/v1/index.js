import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import organizationRoutes from './organizations.js';
import userRoutes from './users.js';
import candidateRoutes from './candidates.js';
import jobRoutes from './jobs.js';
import applicationRoutes from './applications.js';
import interviewRoutes from './interviews.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/candidates', candidateRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);

export default router;
