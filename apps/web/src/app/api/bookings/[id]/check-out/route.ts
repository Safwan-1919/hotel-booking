import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { checkOutSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const data = checkOutSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true, payments: true, services: { include: { service: true } } },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CHECKED_IN') throw new AppError(400, 'Booking is not checked in');

    const actualCheckOut = data.actualCheckOut ? new Date(data.actualCheckOut) : new Date();

    const serviceTotal = booking.services.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    const totalPaid = booking.payments.reduce(
      (sum, p) => sum + (p.paymentType === 'REFUND' ? -Number(p.amount) : Number(p.amount)),
      0,
    );
    const finalAmount = Number(booking.totalAmount) + serviceTotal + Number(booking.taxAmount);
    const remaining = finalAmount - totalPaid;

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CHECKED_OUT', actualCheckOut, totalAmount: finalAmount },
      include: { guest: true, room: { include: { roomType: true } }, payments: true },
    });

    await prisma.room.update({ where: { id: booking.roomId }, data: { status: 'CLEANING' } });
    await prisma.guest.update({ where: { id: booking.guestId }, data: { totalSpent: { increment: finalAmount } } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHECK_OUT',
        entity: 'Booking',
        entityId: id,
        newValues: { status: 'CHECKED_OUT', actualCheckOut, totalAmount: finalAmount, totalPaid, remaining } as unknown as object,
      },
    });

    return NextResponse.json({ booking: updated, totalAmount: finalAmount, totalPaid, remaining });
  } catch (err) {
    return handleError(err);
  }
}