import { Request, Response } from 'express';
import { roomService } from '../services/room.service';
import { createRoomTypeSchema, createRoomSchema, updateRoomStatusSchema } from '../validations';

export class RoomController {
  async getRoomTypes(req: Request, res: Response) {
    const types = await roomService.getRoomTypes();
    res.json(types);
  }

  async createRoomType(req: Request, res: Response) {
    const data = createRoomTypeSchema.parse(req.body);
    const type = await roomService.createRoomType(data);
    res.status(201).json(type);
  }

  async updateRoomType(req: Request, res: Response) {
    const data = createRoomTypeSchema.partial().parse(req.body);
    const type = await roomService.updateRoomType(req.params.id as string, data);
    res.json(type);
  }

  async getRooms(req: Request, res: Response) {
    const { status, floor, roomTypeId, page, limit } = req.query;
    const result = await roomService.getRooms({
      status: status as string,
      floor: floor as string,
      roomTypeId: roomTypeId as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
    });
    res.json(result);
  }

  async createRoom(req: Request, res: Response) {
    const data = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(data);
    res.status(201).json(room);
  }

  async updateRoom(req: Request, res: Response) {
    const data = createRoomSchema.partial().parse(req.body);
    const room = await roomService.updateRoom(req.params.id as string, data);
    res.json(room);
  }

  async updateRoomStatus(req: Request, res: Response) {
    const data = updateRoomStatusSchema.parse(req.body);
    const room = await roomService.updateRoomStatus(req.params.id as string, data.status, data.notes);
    res.json(room);
  }

  async deleteRoom(req: Request, res: Response) {
    await roomService.deleteRoom(req.params.id as string);
    res.json({ message: 'Room deleted successfully' });
  }

  async getRoomAvailability(req: Request, res: Response) {
    const { startDate, endDate } = req.query;
    const availability = await roomService.getRoomAvailability(
      req.params.id as string,
      startDate as string,
      endDate as string
    );
    res.json(availability);
  }

  async getAvailabilitySummary(req: Request, res: Response) {
    const { startDate, endDate } = req.query;
    const summary = await roomService.getAvailabilitySummary(
      startDate as string || new Date().toISOString().split('T')[0],
      endDate as string || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    res.json(summary);
  }
}

export const roomController = new RoomController();
