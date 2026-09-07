import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';
import { createServiceSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, 'ADMIN', 'MANAGER');
    const { id } = await params;
    const data = createServiceSchema.partial().parse(await req.json());
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(404, 'Service not found');
    const updated = await prisma.service.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, 'ADMIN');
    const { id } = await params;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(404, 'Service not found');
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (err) {
    return handleError(err);
  }
}