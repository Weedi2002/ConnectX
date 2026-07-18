import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetSchema), ctrl.resetPassword);
router.post('/change-password', protect, validate(changePasswordSchema), ctrl.changePassword);

export default router;
