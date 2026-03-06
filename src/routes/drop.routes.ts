import { Router } from 'express';
import { createDrop, getAllDrops, reserveDrop } from '../controllers/drop.controller';
import { authenticate } from '../middleware/auth.middleware';
import { completePurchase } from '../controllers/purchase.controller';

const router = Router();
router.post('/', createDrop);
router.get('/', getAllDrops);

router.post('/:id/reserve', authenticate, reserveDrop);

router.post('/purchase', authenticate, completePurchase);

export const dropRoutes = router;