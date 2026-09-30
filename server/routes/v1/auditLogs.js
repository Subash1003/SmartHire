import { Router } from 'express';
import * as auditLogController from '../../controllers/auditLogController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { validateQuery } from '../../middleware/validateMiddleware.js';
import { listAuditLogsQuerySchema } from '../../validators/auditLog.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', validateQuery(listAuditLogsQuerySchema), auditLogController.listAuditLogs);

export default router;
