import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import validate from '../middleware/validate.middleware.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authLimiter, resendLimiter } from '../middleware/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validation/auth.validation.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

// Email Verification
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  resendLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

// Password Management
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Protected Endpoints
router.get('/me', authenticate, authController.getMe);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;