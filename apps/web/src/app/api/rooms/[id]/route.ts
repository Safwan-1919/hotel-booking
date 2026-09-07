import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireRole, requireAuth } from '@/lib/server/auth';
import { createRoomSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const { id } = await params;
    const data = createRoomSchema.partial().parse(await req.json());
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError(404, 'Room not found');
    const updated = await prisma.room.update({ where: { id }, data, include: { roomType: true } });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, 'ADMIN');
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } } } },
    });
    if (!room) throw new AppError(404, 'Room not found');
    if (room.bookings.length > 0) throw new AppError(400, 'Cannot delete room with active bookings');
    await prisma.room.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id }, include: { roomType: true } });
    if (!room) throw new AppError(404, 'Room not found');
    return NextResponse.json(room);
  } catch (err) {
    return handleError(err);
  }
}