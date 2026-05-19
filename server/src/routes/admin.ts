import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
    getDashboardStats,
    getAllOrders,
    updateOrderStatus
} from '../controllers/adminController';

const router = express.Router();

router.use(authenticateUser, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:orderId', updateOrderStatus);

export default router;
