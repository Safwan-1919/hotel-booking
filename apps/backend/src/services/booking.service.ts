import prisma from '../config/prisma';
import { AppError } from '../middleware/error';
import { generateBookingNumber, calculateNights } from '../utils/helpers';

export class BookingService {
  async getBookings(filters: {
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, paymentStatus, startDate, endDate, search, page = 1, limit = 20 } = filters;
    const where: any = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) where.checkInDate.gte = new Date(startDate);
      if (endDate) where.checkInDate.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { guest: { firstName: { contains: search, mode: 'insensitive' } } },
        { guest: { lastName: { contains: search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: search } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: true,
          room: { include: { roomType: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBooking(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        payments: true,
        services: { include: { service: true } },
      },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    return booking;
  }

  async createBooking(data: any, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { roomType: true },
    });
    if (!room) throw new AppError(404, 'Room not found');
    if (room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER') {
      throw new AppError(400, 'Room is not available');
    }

    const guest = await prisma.guest.findUnique({ where: { id: data.guestId } });
    if (!guest) throw new AppError(404, 'Guest not found');

    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    if (checkOut <= checkIn) throw new AppError(400, 'Check-out must be after check-in');

    const conflicting = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });
    if (conflicting) throw new AppError(409, 'Room is already booked for these dates');

    const nights = calculateNights(checkIn, checkOut);
    const totalAmount = (data.roomRate * nights) - (data.discount || 0);
    const taxAmount = totalAmount * 0.12; // 12% tax

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        guestId: data.guestId,
        roomId: data.roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: data.adults || 1,
        children: data.children || 0,
        source: data.source || 'WALK_IN',
        roomRate: data.roomRate,
        totalAmount,
        discount: data.discount || 0,
        taxAmount,
        specialRequests: data.specialRequests,
        internalNotes: data.internalNotes,
        createdByUserId: userId,
        status: 'CONFIRMED',
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
      },
    });

    await prisma.room.update({
      where: { id: data.roomId },
      data: { status: 'RESERVED' },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Booking',
        entityId: booking.id,
        newValues: booking,
      },
    });

    return booking;
  }

  async checkIn(bookingId: string, data: any, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw new AppError(400, 'Booking cannot be checked in');
    }

    const actualCheckIn = data.actualCheckIn ? new Date(data.actualCheckIn) : new Date();

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_IN',
        actualCheckIn,
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
      },
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'OCCUPIED' },
    });

    await prisma.guest.update({
      where: { id: booking.guestId },
      data: { totalStays: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHECK_IN',
        entity: 'Booking',
        entityId: bookingId,
        newValues: { status: 'CHECKED_IN', actualCheckIn },
      },
    });

    return updatedBooking;
  }

  async checkOut(bookingId: string, data: any, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true, payments: true, services: { include: { service: true } } },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CHECKED_IN') {
      throw new AppError(400, 'Booking is not checked in');
    }

    const actualCheckOut = data.actualCheckOut ? new Date(data.actualCheckOut) : new Date();

    const serviceTotal = booking.services.reduce(
      (sum, s) => sum + Number(s.totalPrice),
      0
    );
    const totalPaid = booking.payments.reduce(
      (sum, p) => sum + (p.paymentType === 'REFUND' ? -Number(p.amount) : Number(p.amount)),
      0
    );
    const finalAmount = Number(booking.totalAmount) + serviceTotal + Number(booking.taxAmount);
    const remaining = finalAmount - totalPaid;

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        actualCheckOut,
        totalAmount: finalAmount,
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        payments: true,
      },
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'CLEANING' },
    });

    await prisma.guest.update({
      where: { id: booking.guestId },
      data: { totalSpent: { increment: finalAmount } },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHECK_OUT',
        entity: 'Booking',
        entityId: bookingId,
        newValues: {
          status: 'CHECKED_OUT',
          actualCheckOut,
          totalAmount: finalAmount,
          totalPaid,
          remaining,
        },
      },
    });

    return { booking: updatedBooking, totalAmount: finalAmount, totalPaid, remaining };
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status === 'CHECKED_OUT' || booking.status === 'CANCELLED') {
      throw new AppError(400, 'Booking cannot be cancelled');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'AVAILABLE' },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANCEL',
        entity: 'Booking',
        entityId: bookingId,
        newValues: { status: 'CANCELLED', reason },
      },
    });

    return updatedBooking;
  }

  async addService(bookingId: string, serviceData: any) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CHECKED_IN') {
      throw new AppError(400, 'Can only add services to checked-in bookings');
    }

    const service = await prisma.service.findUnique({ where: { id: serviceData.serviceId } });
    if (!service) throw new AppError(404, 'Service not found');

    return prisma.bookingService.create({
      data: {
        bookingId,
        serviceId: serviceData.serviceId,
        quantity: serviceData.quantity || 1,
        unitPrice: service.price,
        totalPrice: Number(service.price) * (serviceData.quantity || 1),
        notes: serviceData.notes,
      },
      include: { service: true },
    });
  }
}

export const bookingService = new BookingService();
