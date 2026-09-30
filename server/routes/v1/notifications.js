import { Router } from 'express';
import * as notificationController from '../../controllers/notificationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validateQuery } from '../../middleware/validateMiddleware.js';
import { listNotificationsQuerySchema } from '../../validators/notification.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(listNotificationsQuerySchema), notificationController.listNotifications);
router.patch('/:id/read', verifyCsrf, notificationController.markAsRead);
router.patch('/read-all', verifyCsrf, notificationController.markAllAsRead);

export default router;
