import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { updateRoomStatusSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const data = updateRoomStatusSchema.parse(await req.json());
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError(404, 'Room not found');
    const updated = await prisma.room.update({
      where: { id },
      data: { status: data.status as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'CLEANING' | 'OUT_OF_ORDER', notes: data.notes || room.notes },
      include: { roomType: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}