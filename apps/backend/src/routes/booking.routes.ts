import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, bookingController.getBookings.bind(bookingController));
router.get('/:id', authenticate, bookingController.getBooking.bind(bookingController));
router.post('/', authenticate, bookingController.createBooking.bind(bookingController));
router.post('/:id/check-in', authenticate, bookingController.checkIn.bind(bookingController));
router.post('/:id/check-out', authenticate, bookingController.checkOut.bind(bookingController));
router.post('/:id/cancel', authenticate, bookingController.cancelBooking.bind(bookingController));
router.post('/:id/services', authenticate, bookingController.addService.bind(bookingController));

export default router;
