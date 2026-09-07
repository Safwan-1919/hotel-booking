import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, serviceController.getServices.bind(serviceController));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), serviceController.createService.bind(serviceController));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), serviceController.updateService.bind(serviceController));
router.delete('/:id', authenticate, authorize('ADMIN'), serviceController.deleteService.bind(serviceController));

export default router;
