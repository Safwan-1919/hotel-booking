import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const bookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        ...(startDate && endDate
          ? { OR: [{ checkInDate: { lt: new Date(endDate) }, checkOutDate: { gt: new Date(startDate) } }] }
          : {}),
      },
      select: { checkInDate: true, checkOutDate: true, status: true, bookingNumber: true },
    });
    return NextResponse.json(bookings);
  } catch (err) {
    return handleError(err);
  }
}