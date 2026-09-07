import prisma from '../config/prisma';
import { AppError } from '../middleware/error';

export class ServiceService {
  async getServices(category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return prisma.service.findMany({ where, orderBy: { name: 'asc' } });
  }

  async createService(data: any) {
    const existing = await prisma.service.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError(409, 'Service name already exists');
    return prisma.service.create({ data });
  }

  async updateService(id: string, data: any) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(404, 'Service not found');
    return prisma.service.update({ where: { id }, data });
  }

  async deleteService(id: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(404, 'Service not found');
    return prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}

export const serviceService = new ServiceService();
