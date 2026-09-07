import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { addBookingServiceSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const data = addBookingServiceSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CHECKED_IN') throw new AppError(400, 'Can only add services to checked-in bookings');

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new AppError(404, 'Service not found');

    const quantity = data.quantity || 1;
    const created = await prisma.bookingService.create({
      data: {
        bookingId: id,
        serviceId: data.serviceId,
        quantity,
        unitPrice: service.price,
        totalPrice: Number(service.price) * quantity,
        notes: data.notes,
      },
      include: { service: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}