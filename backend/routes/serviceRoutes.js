import { Router } from 'express';
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getServices);
router.post('/', protect, requireRole('owner'), createService);
router.put('/:id', protect, requireRole('owner'), updateService);
router.delete('/:id', protect, requireRole('owner'), deleteService);

export default router;
