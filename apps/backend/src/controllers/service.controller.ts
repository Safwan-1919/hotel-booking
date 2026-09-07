import { Request, Response } from 'express';
import { serviceService } from '../services/service.service';
import { createServiceSchema } from '../validations';

export class ServiceController {
  async getServices(req: Request, res: Response) {
    const { category } = req.query;
    const services = await serviceService.getServices(category as string);
    res.json(services);
  }

  async createService(req: Request, res: Response) {
    const data = createServiceSchema.parse(req.body);
    const service = await serviceService.createService(data);
    res.status(201).json(service);
  }

  async updateService(req: Request, res: Response) {
    const data = createServiceSchema.partial().parse(req.body);
    const service = await serviceService.updateService(req.params.id as string, data);
    res.json(service);
  }

  async deleteService(req: Request, res: Response) {
    await serviceService.deleteService(req.params.id as string);
    res.json({ message: 'Service deleted successfully' });
  }
}

export const serviceController = new ServiceController();
