import { Router } from 'express';
import * as userController from '../../controllers/userController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate, validateQuery } from '../../middleware/validateMiddleware.js';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from '../../validators/user.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', validateQuery(listUsersQuerySchema), userController.listUsers);
router.post('/', verifyCsrf, validate(createUserSchema), userController.createUser);
router.get('/:id', userController.getUser);
router.put('/:id', verifyCsrf, validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', verifyCsrf, validate(updateUserStatusSchema), userController.updateUserStatus);

export default router;
