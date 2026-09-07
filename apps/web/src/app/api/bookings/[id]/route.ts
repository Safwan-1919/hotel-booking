import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
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
    return NextResponse.json(booking);
  } catch (err) {
    return handleError(err);
  }
}