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

router.use(requireAuth);

// Recruiters can read the org's staff list (needed to assign interviewers
// when scheduling); only admins can create/edit/deactivate users.
router.get('/', requireRole('admin', 'recruiter'), validateQuery(listUsersQuerySchema), userController.listUsers);
router.get('/:id', requireRole('admin', 'recruiter'), userController.getUser);
router.post('/', requireRole('admin'), verifyCsrf, validate(createUserSchema), userController.createUser);
router.put('/:id', requireRole('admin'), verifyCsrf, validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', requireRole('admin'), verifyCsrf, validate(updateUserStatusSchema), userController.updateUserStatus);

export default router;
