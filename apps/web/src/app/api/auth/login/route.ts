import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/prisma';
import { signToken } from '@/lib/server/auth';
import { loginSchema } from '@/lib/server/validation';
import { handleError, jsonError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) throw new AppError(401, 'Invalid credentials');
    if (user.status !== 'ACTIVE') throw new AppError(403, 'Account is inactive');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken(user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return handleError(err);
  }
}

export async function GET() {
  return jsonError('Method not allowed', 405);
}