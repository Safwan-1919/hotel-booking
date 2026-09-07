import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason;

    const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status === 'CHECKED_OUT' || booking.status === 'CANCELLED') {
      throw new AppError(400, 'Booking cannot be cancelled');
    }

    const updated = await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
    await prisma.room.update({ where: { id: booking.roomId }, data: { status: 'AVAILABLE' } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CANCEL',
        entity: 'Booking',
        entityId: id,
        newValues: { status: 'CANCELLED', reason } as unknown as object,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}