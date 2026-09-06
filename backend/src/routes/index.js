/**
 * REST API routes. See API.md for the full reference.
 *
 * Everything under /api/requests requires a valid token; role-based access
 * control is applied per route with requireRole().
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as requests from '../controllers/requestController.js';

const router = Router();

/** Slows down password-guessing attacks against the login form. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' }
});

/* ------------------------------------------------------------------- auth */
router.post('/auth/register', loginLimiter, auth.register);
router.post('/auth/login', loginLimiter, auth.login);
router.get('/auth/me', authenticate, auth.me);
router.put('/auth/profile', authenticate, auth.updateProfile);

/* -------------------------------------------------------- reference data */
router.get('/categories', authenticate, requests.listCategories);
router.get('/reference', authenticate, requests.referenceData);

/* --------------------------------------------------------------- requests */
router.get('/dashboard', authenticate, requests.dashboard);

router.get('/requests', authenticate, requests.listRequests);
router.post(
  '/requests',
  authenticate,
  requireRole('student'),
  uploadPhoto,
  requests.createRequest
);
router.get('/requests/:id', authenticate, requests.getRequest);
router.get('/requests/:id/image', authenticate, requests.getRequestImage);

router.post(
  '/requests/:id/assign',
  authenticate,
  requireRole('maintenance'),
  requests.assignRequest
);
router.patch(
  '/requests/:id/status',
  authenticate,
  requireRole('maintenance'),
  requests.updateStatus
);
router.post(
  '/requests/:id/updates',
  authenticate,
  requireRole('maintenance'),
  requests.addNote
);

export default router;
