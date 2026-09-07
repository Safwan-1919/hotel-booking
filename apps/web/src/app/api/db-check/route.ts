import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result: Record<string, unknown> = { ok: true };
  try {
    const url = process.env.DATABASE_URL;
    result.hasDbUrl = Boolean(url);
    result.dbUrlHost = url ? new URL(url).host : null;
    result.dbUrlProtocol = url ? new URL(url).protocol.replace(':', '') : null;
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    result.dbPingMs = Date.now() - start;
    result.usersCount = await prisma.user.count();
  } catch (err) {
    result.dbError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
  return NextResponse.json(result);
}