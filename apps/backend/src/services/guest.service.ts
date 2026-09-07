import prisma from '../config/prisma';
import { AppError } from '../middleware/error';

export class GuestService {
  async getGuests(filters: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = filters;
    const where: any = {};

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
      prisma.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.guest.count({ where }),
    ]);
    return { guests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getGuest(id: string) {
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
    return guest;
  }

  async createGuest(data: any) {
    if (data.email) {
      const existing = await prisma.guest.findFirst({ where: { email: data.email } });
      if (existing) throw new AppError(409, 'Guest with this email already exists');
    }
    const existingPhone = await prisma.guest.findFirst({ where: { phone: data.phone } });
    if (existingPhone) throw new AppError(409, 'Guest with this phone already exists');

    return prisma.guest.create({ data });
  }

  async updateGuest(id: string, data: any) {
    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) throw new AppError(404, 'Guest not found');
    return prisma.guest.update({ where: { id }, data });
  }

  async getGuestStats() {
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

    return { total, active, blacklisted, topGuests };
  }
}

export const guestService = new GuestService();
