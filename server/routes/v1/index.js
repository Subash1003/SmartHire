import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import organizationRoutes from './organizations.js';
import userRoutes from './users.js';
import candidateRoutes from './candidates.js';
import jobRoutes from './jobs.js';
import applicationRoutes from './applications.js';
import interviewRoutes from './interviews.js';
import evaluationRoutes from './evaluations.js';
import aiRoutes from './ai.js';
import notificationRoutes from './notifications.js';
import analyticsRoutes from './analytics.js';
import auditLogRoutes from './auditLogs.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/candidates', candidateRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
