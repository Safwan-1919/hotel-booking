import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from './prisma';
import { AppError } from './errors';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  let decoded: { userId: string };
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError(401, 'Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'Invalid or inactive user');
  }

  return { id: user.id, email: user.email, role: user.role };
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  return getAuthUser(req);
}

export async function requireRole(req: NextRequest, ...roles: string[]): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!roles.includes(user.role)) {
    throw new AppError(403, 'Insufficient permissions');
  }
  return user;
}