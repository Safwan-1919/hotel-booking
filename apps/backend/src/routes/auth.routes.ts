import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/users', authenticate, authorize('ADMIN'), authController.createUser.bind(authController));
router.get('/users', authenticate, authorize('ADMIN'), authController.getUsers.bind(authController));
router.get('/users/:id', authenticate, authorize('ADMIN'), authController.getUser.bind(authController));

export default router;
