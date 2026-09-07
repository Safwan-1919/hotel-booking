import { Router } from 'express';
import { roomController } from '../controllers/room.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/types', authenticate, roomController.getRoomTypes.bind(roomController));
router.post('/types', authenticate, authorize('ADMIN', 'MANAGER'), roomController.createRoomType.bind(roomController));
router.put('/types/:id', authenticate, authorize('ADMIN', 'MANAGER'), roomController.updateRoomType.bind(roomController));

router.get('/', authenticate, roomController.getRooms.bind(roomController));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), roomController.createRoom.bind(roomController));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), roomController.updateRoom.bind(roomController));
router.patch('/:id/status', authenticate, roomController.updateRoomStatus.bind(roomController));
router.delete('/:id', authenticate, authorize('ADMIN'), roomController.deleteRoom.bind(roomController));

router.get('/:id/availability', authenticate, roomController.getRoomAvailability.bind(roomController));
router.get('/availability/summary', authenticate, roomController.getAvailabilitySummary.bind(roomController));

export default router;
