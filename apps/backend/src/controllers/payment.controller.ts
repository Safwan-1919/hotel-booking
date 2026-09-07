import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { createPaymentSchema } from '../validations';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  async getPayments(req: Request, res: Response) {
    const { bookingId, page, limit } = req.query;
    const result = await paymentService.getPayments({
      bookingId: bookingId as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });
    res.json(result);
  }

  async createPayment(req: AuthRequest, res: Response) {
    const data = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(
      req.params.bookingId as string,
      data,
      req.user!.id
    );
    res.status(201).json(payment);
  }

  async getPaymentSummary(req: Request, res: Response) {
    const summary = await paymentService.getPaymentSummary();
    res.json(summary);
  }
}

export const paymentController = new PaymentController();
