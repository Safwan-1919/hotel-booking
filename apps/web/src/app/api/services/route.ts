import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth, requireRole } from '@/lib/server/auth';
import { createServiceSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category') || undefined;
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    const services = await prisma.service.findMany({ where, orderBy: { name: 'asc' } });
    return NextResponse.json(services);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const data = createServiceSchema.parse(await req.json());
    const existing = await prisma.service.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError(409, 'Service name already exists');
    const service = await prisma.service.create({ data });
    return NextResponse.json(service, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}