import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { handleError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayPayments, totalRevenue, pendingPayments] = await Promise.all([
      prisma.payment.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.booking.aggregate({
        where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] }, status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      today: { count: todayPayments._count, total: Number(todayPayments._sum.amount || 0) },
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      pending: {
        count: pendingPayments._count,
        totalDue: Number(pendingPayments._sum.totalAmount || 0) - Number(pendingPayments._sum.paidAmount || 0),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}