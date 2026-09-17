import { Router } from 'express';
import * as authController from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { verifyCsrf } from '../../middleware/csrfMiddleware.js';
import { validate } from '../../middleware/validateMiddleware.js';
import { authLimiter } from '../../middleware/rateLimiters.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../validators/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', verifyCsrf, authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

export default router;
