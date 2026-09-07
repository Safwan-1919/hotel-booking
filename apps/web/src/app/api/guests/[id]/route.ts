import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { createGuestSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { room: { include: { roomType: true } } },
        },
      },
    });
    if (!guest) throw new AppError(404, 'Guest not found');
    return NextResponse.json(guest);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const data = createGuestSchema.partial().parse(await req.json());
    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) throw new AppError(404, 'Guest not found');
    const updated = await prisma.guest.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}