import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const total = await prisma.guest.count();
    const active = await prisma.guest.count({ where: { status: 'ACTIVE' } });
    const blacklisted = await prisma.guest.count({ where: { status: 'BLACKLISTED' } });
    const topGuests = await prisma.guest.findMany({
      orderBy: { totalStays: 'desc' },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        totalStays: true,
        totalSpent: true,
      },
    });
    return NextResponse.json({ total, active, blacklisted, topGuests });
  } catch (err) {
    return handleError(err);
  }
}