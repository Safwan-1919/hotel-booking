import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getOverview(req: Request, res: Response) {
    const overview = await dashboardService.getOverview();
    res.json(overview);
  }

  async getOccupancyReport(req: Request, res: Response) {
    const { startDate, endDate } = req.query;
    const report = await dashboardService.getOccupancyReport(
      startDate as string || new Date().toISOString().split('T')[0],
      endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    res.json(report);
  }
}

export const dashboardController = new DashboardController();
