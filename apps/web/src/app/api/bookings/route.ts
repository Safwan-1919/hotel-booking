import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { createBookingSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';
import { generateBookingNumber, calculateNights } from '@/lib/server/helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) (where.checkInDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.checkInDate as Record<string, unknown>).lte = new Date(endDate);
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
        include: { guest: true, room: { include: { roomType: true } }, payments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return NextResponse.json({ bookings, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const data = createBookingSchema.parse(await req.json());

    const room = await prisma.room.findUnique({ where: { id: data.roomId }, include: { roomType: true } });
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
    const totalAmount = data.roomRate * nights - (data.discount || 0);
    const taxAmount = totalAmount * 0.12;

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
        createdByUserId: user.id,
        status: 'CONFIRMED',
      },
      include: { guest: true, room: { include: { roomType: true } } },
    });

    await prisma.room.update({ where: { id: data.roomId }, data: { status: 'RESERVED' } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'Booking',
        entityId: booking.id,
        newValues: booking as unknown as object,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}