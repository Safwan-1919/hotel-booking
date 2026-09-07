import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { createGuestSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [guests, total] = await Promise.all([
      prisma.guest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.guest.count({ where }),
    ]);
    return NextResponse.json({ guests, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const data = createGuestSchema.parse(await req.json());
    if (data.email) {
      const existing = await prisma.guest.findFirst({ where: { email: data.email } });
      if (existing) throw new AppError(409, 'Guest with this email already exists');
    }
    const existingPhone = await prisma.guest.findFirst({ where: { phone: data.phone } });
    if (existingPhone) throw new AppError(409, 'Guest with this phone already exists');
    const guest = await prisma.guest.create({ data });
    return NextResponse.json(guest, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}