import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { checkInSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const data = checkInSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw new AppError(400, 'Booking cannot be checked in');
    }

    const actualCheckIn = data.actualCheckIn ? new Date(data.actualCheckIn) : new Date();
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CHECKED_IN', actualCheckIn },
      include: { guest: true, room: { include: { roomType: true } } },
    });

    await prisma.room.update({ where: { id: booking.roomId }, data: { status: 'OCCUPIED' } });
    await prisma.guest.update({ where: { id: booking.guestId }, data: { totalStays: { increment: 1 } } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHECK_IN',
        entity: 'Booking',
        entityId: id,
        newValues: { status: 'CHECKED_IN', actualCheckIn } as unknown as object,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}