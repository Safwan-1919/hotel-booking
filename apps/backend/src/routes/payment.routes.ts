import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, paymentController.getPaymentSummary.bind(paymentController));
router.get('/', authenticate, paymentController.getPayments.bind(paymentController));
router.post('/:bookingId', authenticate, paymentController.createPayment.bind(paymentController));

export default router;
