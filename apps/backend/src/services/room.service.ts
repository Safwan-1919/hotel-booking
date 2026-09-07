import prisma from '../config/prisma';
import { AppError } from '../middleware/error';

export class RoomService {
  async getRoomTypes() {
    return prisma.roomType.findMany({
      where: { isActive: true },
      include: { _count: { select: { rooms: true } } },
      orderBy: { basePrice: 'asc' },
    });
  }

  async createRoomType(data: any) {
    const existing = await prisma.roomType.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError(409, 'Room type name already exists');
    return prisma.roomType.create({ data });
  }

  async updateRoomType(id: string, data: any) {
    const roomType = await prisma.roomType.findUnique({ where: { id } });
    if (!roomType) throw new AppError(404, 'Room type not found');
    return prisma.roomType.update({ where: { id }, data });
  }

  async getRooms(filters: { status?: string; floor?: string; roomTypeId?: string; page?: number; limit?: number }) {
    const { status, floor, roomTypeId, page = 1, limit = 50 } = filters;
    const where: any = { isActive: true };
    if (status) where.status = status;
    if (floor) where.floor = floor;
    if (roomTypeId) where.roomTypeId = roomTypeId;

    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { roomType: true },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.room.count({ where }),
    ]);
    return { rooms, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createRoom(data: any) {
    const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (existing) throw new AppError(409, 'Room number already exists');
    const roomType = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
    if (!roomType) throw new AppError(404, 'Room type not found');
    return prisma.room.create({ data, include: { roomType: true } });
  }

  async updateRoom(id: string, data: any) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError(404, 'Room not found');
    return prisma.room.update({ where: { id }, data, include: { roomType: true } });
  }

  async updateRoomStatus(id: string, status: string, notes?: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError(404, 'Room not found');
    return prisma.room.update({
      where: { id },
      data: { status: status as any, notes: notes || room.notes },
      include: { roomType: true },
    });
  }

  async deleteRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } } } },
    });
    if (!room) throw new AppError(404, 'Room not found');
    if (room.bookings.length > 0) throw new AppError(400, 'Cannot delete room with active bookings');
    return prisma.room.update({ where: { id }, data: { isActive: false } });
  }

  async getRoomAvailability(roomId: string, startDate: string, endDate: string) {
    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        OR: [
          { checkInDate: { lt: new Date(endDate) }, checkOutDate: { gt: new Date(startDate) } },
        ],
      },
      select: { checkInDate: true, checkOutDate: true, status: true, bookingNumber: true },
    });
    return bookings;
  }

  async getAvailabilitySummary(startDate: string, endDate: string) {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: { roomType: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: new Date(endDate) },
        checkOutDate: { gt: new Date(startDate) },
      },
      select: { roomId: true, checkInDate: true, checkOutDate: true },
    });

    const roomBookingsMap = new Map<string, number>();
    bookings.forEach((b) => {
      const count = roomBookingsMap.get(b.roomId) || 0;
      roomBookingsMap.set(b.roomId, count + 1);
    });

    const summary = rooms.map((room) => ({
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType.name,
      basePrice: room.roomType.basePrice,
      isAvailable: !roomBookingsMap.has(room.id),
      status: room.status,
    }));

    const available = summary.filter((r) => r.isAvailable && r.status === 'AVAILABLE').length;
    const occupied = summary.filter((r) => !r.isAvailable || r.status === 'OCCUPIED').length;
    const maintenance = summary.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_ORDER').length;

    return {
      rooms: summary,
      stats: { total: rooms.length, available, occupied, maintenance },
    };
  }
}

export const roomService = new RoomService();
