import prisma from '../config/prisma';
import { AppError } from '../middleware/error';

export class PaymentService {
  async getPayments(filters: { bookingId?: string; page?: number; limit?: number }) {
    const { bookingId, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (bookingId) where.bookingId = bookingId;

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { booking: { include: { guest: true, room: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);
    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createPayment(bookingId: string, data: any, processedBy?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status === 'CANCELLED') throw new AppError(400, 'Cannot pay for cancelled booking');

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType || 'ROOM_CHARGE',
        reference: data.reference,
        notes: data.notes,
        processedBy,
      },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { bookingId },
      _sum: { amount: true },
    });

    const paid = Number(totalPaid._sum.amount || 0);
    let paymentStatus = 'UNPAID';
    if (paid >= Number(booking.totalAmount)) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: paymentStatus as any,
        paidAmount: paid,
        paymentMethod: data.paymentMethod,
      },
    });

    return payment;
  }

  async getPaymentSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await prisma.payment.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { amount: true },
      _count: true,
    });

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    const pendingPayments = await prisma.booking.aggregate({
      where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] }, status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    return {
      today: {
        count: todayPayments._count,
        total: Number(todayPayments._sum.amount || 0),
      },
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      pending: {
        count: pendingPayments._count,
        totalDue: Number(pendingPayments._sum.totalAmount || 0) - Number(pendingPayments._sum.paidAmount || 0),
      },
    };
  }
}

export const paymentService = new PaymentService();
