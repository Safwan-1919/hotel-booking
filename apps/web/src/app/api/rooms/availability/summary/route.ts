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
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || today;
    const endDate = searchParams.get('endDate') || weekFromNow;

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: { roomType: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: new Date(endDate) },
        checkOutDate: { gt: new Date(startDate) },
      },
      select: { roomId: true },
    });

    const roomBookingsMap = new Map<string, number>();
    bookings.forEach((b) => {
      roomBookingsMap.set(b.roomId, (roomBookingsMap.get(b.roomId) || 0) + 1);
    });

    const summary = rooms.map((room) => ({
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType.name,
      basePrice: room.roomType.basePrice,
      isAvailable: !roomBookingsMap.has(room.id),
      status: room.status,
    }));

    const available = summary.filter((r) => r.isAvailable && r.status === 'AVAILABLE').length;
    const occupied = summary.filter((r) => !r.isAvailable || r.status === 'OCCUPIED').length;
    const maintenance = summary.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_ORDER').length;

    return NextResponse.json({
      rooms: summary,
      stats: { total: rooms.length, available, occupied, maintenance },
    });
  } catch (err) {
    return handleError(err);
  }
}