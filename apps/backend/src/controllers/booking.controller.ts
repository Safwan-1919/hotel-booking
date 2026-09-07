import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { createBookingSchema, checkInSchema, checkOutSchema } from '../validations';
import { AuthRequest } from '../middleware/auth';

export class BookingController {
  async getBookings(req: Request, res: Response) {
    const { status, paymentStatus, startDate, endDate, search, page, limit } = req.query;
    const result = await bookingService.getBookings({
      status: status as string,
      paymentStatus: paymentStatus as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });
    res.json(result);
  }

  async getBooking(req: Request, res: Response) {
    const booking = await bookingService.getBooking(req.params.id as string);
    res.json(booking);
  }

  async createBooking(req: AuthRequest, res: Response) {
    const data = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(data, req.user!.id);
    res.status(201).json(booking);
  }

  async checkIn(req: AuthRequest, res: Response) {
    const data = checkInSchema.parse(req.body);
    const booking = await bookingService.checkIn(req.params.id as string, data, req.user!.id);
    res.json(booking);
  }

  async checkOut(req: AuthRequest, res: Response) {
    const data = checkOutSchema.parse(req.body);
    const result = await bookingService.checkOut(req.params.id as string, data, req.user!.id);
    res.json(result);
  }

  async cancelBooking(req: AuthRequest, res: Response) {
    const result = await bookingService.cancelBooking(req.params.id as string, req.user!.id, req.body.reason);
    res.json(result);
  }

  async addService(req: Request, res: Response) {
    const service = await bookingService.addService(req.params.id as string, req.body);
    res.status(201).json(service);
  }
}

export const bookingController = new BookingController();
