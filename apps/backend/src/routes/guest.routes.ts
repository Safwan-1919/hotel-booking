import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, guestController.getGuestStats.bind(guestController));
router.get('/', authenticate, guestController.getGuests.bind(guestController));
router.get('/:id', authenticate, guestController.getGuest.bind(guestController));
router.post('/', authenticate, guestController.createGuest.bind(guestController));
router.put('/:id', authenticate, guestController.updateGuest.bind(guestController));

export default router;
