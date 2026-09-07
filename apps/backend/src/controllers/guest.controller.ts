import { Request, Response } from 'express';
import { guestService } from '../services/guest.service';
import { createGuestSchema } from '../validations';

export class GuestController {
  async getGuests(req: Request, res: Response) {
    const { search, page, limit } = req.query;
    const result = await guestService.getGuests({
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });
    res.json(result);
  }

  async getGuest(req: Request, res: Response) {
    const guest = await guestService.getGuest(req.params.id as string);
    res.json(guest);
  }

  async createGuest(req: Request, res: Response) {
    const data = createGuestSchema.parse(req.body);
    const guest = await guestService.createGuest(data);
    res.status(201).json(guest);
  }

  async updateGuest(req: Request, res: Response) {
    const data = createGuestSchema.partial().parse(req.body);
    const guest = await guestService.updateGuest(req.params.id as string, data);
    res.json(guest);
  }

  async getGuestStats(req: Request, res: Response) {
    const stats = await guestService.getGuestStats();
    res.json(stats);
  }
}

export const guestController = new GuestController();
