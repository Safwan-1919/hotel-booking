import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth, requireRole } from '@/lib/server/auth';
import { createRoomSchema, updateRoomStatusSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || undefined;
    const floor = searchParams.get('floor') || undefined;
    const roomTypeId = searchParams.get('roomTypeId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { isActive: true };
    if (status) where.status = status;
    if (floor) where.floor = floor;
    if (roomTypeId) where.roomTypeId = roomTypeId;

    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { roomType: true },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.room.count({ where }),
    ]);
    return NextResponse.json({ rooms, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const data = createRoomSchema.parse(await req.json());
    const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (existing) throw new AppError(409, 'Room number already exists');
    const roomType = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
    if (!roomType) throw new AppError(404, 'Room type not found');
    const room = await prisma.room.create({ data, include: { roomType: true } });
    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}