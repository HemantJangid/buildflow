import express from 'express';
import {
  signup,
  register,
  login,
  getMe,
  updateUserMetadata,
  getUserOptions,
  getAllUsers,
  updateUser,
} from '../controllers/authController.js';
import { PERMISSIONS } from '../constants.js';
import { protect, hasPermission } from '../middleware/auth.js';
import { zodValidate } from '../middleware/zodValidate.js';
import {
  loginSchema,
  signupSchema,
  registerSchema,
} from '@buildflow/shared';

const router = express.Router();

// Routes — validation is now handled by Zod schemas from @buildflow/shared
router.post('/signup', zodValidate(signupSchema), signup);
router.post('/register', protect, hasPermission(PERMISSIONS.USERS_CREATE), zodValidate(registerSchema), register);
router.post('/login', zodValidate(loginSchema), login);
router.get('/me', protect, getMe);
router.get('/users/options', protect, hasPermission(PERMISSIONS.USERS_READ), getUserOptions);
router.get('/users', protect, hasPermission(PERMISSIONS.USERS_READ), getAllUsers);
router.put('/users/:id/metadata', protect, hasPermission(PERMISSIONS.USERS_UPDATE), updateUserMetadata);
router.put('/users/:id', protect, hasPermission(PERMISSIONS.USERS_UPDATE), updateUser);

export default router;
