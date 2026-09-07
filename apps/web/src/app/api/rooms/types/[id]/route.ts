import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';
import { createRoomTypeSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const { id } = await params;
    const data = createRoomTypeSchema.partial().parse(await req.json());
    const existing = await prisma.roomType.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Room type not found');
    const type = await prisma.roomType.update({ where: { id }, data });
    return NextResponse.json(type);
  } catch (err) {
    return handleError(err);
  }
}