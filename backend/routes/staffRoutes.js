import { Router } from 'express';
import { getStaff } from '../controllers/staffController.js';

const router = Router();

router.get('/', getStaff);

export default router;
