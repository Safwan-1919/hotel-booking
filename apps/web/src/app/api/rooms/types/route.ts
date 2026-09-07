import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth, requireRole } from '@/lib/server/auth';
import { createRoomTypeSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const types = await prisma.roomType.findMany({
      where: { isActive: true },
      include: { _count: { select: { rooms: true } } },
      orderBy: { basePrice: 'asc' },
    });
    return NextResponse.json(types);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const data = createRoomTypeSchema.parse(await req.json());
    const existing = await prisma.roomType.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError(409, 'Room type name already exists');
    const type = await prisma.roomType.create({ data });
    return NextResponse.json(type, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}