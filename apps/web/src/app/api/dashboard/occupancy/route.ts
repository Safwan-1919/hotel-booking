import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = req.nextUrl;
    const today = new Date().toISOString().split('T')[0];
    const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || today;
    const endDate = searchParams.get('endDate') || monthFromNow;

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: { roomType: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkInDate: { lt: new Date(endDate) },
        checkOutDate: { gt: new Date(startDate) },
      },
      select: { roomId: true, checkInDate: true, checkOutDate: true, status: true },
    });

    const report = rooms.map((room) => {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType.name,
        bookingCount: roomBookings.length,
        statuses: roomBookings.map((b) => b.status),
      };
    });

    return NextResponse.json(report);
  } catch (err) {
    return handleError(err);
  }
}