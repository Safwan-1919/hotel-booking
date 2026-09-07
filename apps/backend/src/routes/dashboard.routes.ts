import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, dashboardController.getOverview.bind(dashboardController));
router.get('/occupancy', authenticate, dashboardController.getOccupancyReport.bind(dashboardController));

export default router;
