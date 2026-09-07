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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      maintenanceRooms,
      cleaningRooms,
      todayCheckIns,
      todayCheckOuts,
      currentGuests,
      todayRevenue,
      monthlyRevenue,
      pendingPayments,
      totalGuests,
      monthlyBookings,
    ] = await Promise.all([
      prisma.room.count({ where: { isActive: true } }),
      prisma.room.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.room.count({ where: { status: 'OCCUPIED', isActive: true } }),
      prisma.room.count({ where: { status: 'RESERVED', isActive: true } }),
      prisma.room.count({ where: { status: 'MAINTENANCE', isActive: true } }),
      prisma.room.count({ where: { status: 'CLEANING', isActive: true } }),
      prisma.booking.count({ where: { status: 'CHECKED_IN', checkInDate: { gte: today, lt: tomorrow } } }),
      prisma.booking.count({ where: { status: 'CHECKED_OUT', actualCheckOut: { gte: today, lt: tomorrow } } }),
      prisma.booking.count({ where: { status: 'CHECKED_IN' } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.booking.aggregate({
        where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] }, status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      prisma.guest.count(),
      prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round(((occupiedRooms + reservedRooms) / totalRooms) * 100) : 0;

    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { include: { roomType: { select: { name: true } } } },
      },
    });

    const roomTypeDistribution = await prisma.roomType.findMany({
      select: { name: true, _count: { select: { rooms: true } } },
    });

    const bookingsBySource = await prisma.booking.groupBy({
      by: ['source'],
      _count: true,
      where: { createdAt: { gte: monthStart } },
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
      where: { createdAt: { gte: monthStart } },
    });

    const rawPaymentsByMethod = await prisma.payment.findMany({
      select: { paymentMethod: true, amount: true },
      where: { createdAt: { gte: monthStart } },
    });
    const paymentsByMethodMap: Record<string, { amount: number; count: number }> = {};
    rawPaymentsByMethod.forEach((p) => {
      const key = p.paymentMethod;
      if (!paymentsByMethodMap[key]) paymentsByMethodMap[key] = { amount: 0, count: 0 };
      paymentsByMethodMap[key].amount += Number(p.amount);
      paymentsByMethodMap[key].count += 1;
    });
    const paymentsByMethod = Object.entries(paymentsByMethodMap).map(([method, data]) => ({
      method,
      _sum: { amount: String(data.amount) },
      _count: data.count,
    }));

    const rawDailyRevenue = await prisma.payment.findMany({
      select: { amount: true, createdAt: true },
      where: { createdAt: { gte: monthStart } },
    });
    const dailyRevenueMap: Record<string, number> = {};
    rawDailyRevenue.forEach((p) => {
      const day = p.createdAt.toISOString().split('T')[0];
      dailyRevenueMap[day] = (dailyRevenueMap[day] || 0) + Number(p.amount);
    });
    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        reserved: reservedRooms,
        maintenance: maintenanceRooms,
        cleaning: cleaningRooms,
        occupancyRate,
      },
      bookings: { todayCheckIns, todayCheckOuts, currentGuests, monthlyBookings },
      revenue: { today: Number(todayRevenue._sum.amount || 0), monthly: Number(monthlyRevenue._sum.amount || 0) },
      payments: {
        pendingCount: pendingPayments._count,
        pendingAmount: Number(pendingPayments._sum.totalAmount || 0) - Number(pendingPayments._sum.paidAmount || 0),
      },
      totalGuests,
      recentBookings,
      roomTypeDistribution,
      bookingsBySource,
      bookingsByStatus,
      paymentsByMethod,
      dailyRevenue,
    });
  } catch (err) {
    return handleError(err);
  }
}