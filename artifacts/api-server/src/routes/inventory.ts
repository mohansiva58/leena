import express from 'express';
import {
    reserveStock,
    releaseStock,
    confirmReservation,
    refreshReservation,
    refreshAllReservations,
    releaseAllForSession,
    getProductStock,
    getAuditHistory,
} from '../controllers/inventoryController';

const router = express.Router();

router.post('/reserve', reserveStock);
router.post('/release', releaseStock);
router.post('/confirm', confirmReservation);
router.post('/refresh', refreshReservation);
router.post('/refresh-all', refreshAllReservations);
router.post('/release-all', releaseAllForSession);
router.get('/products/:id/stock', getProductStock);
router.get('/audit/:productId', getAuditHistory);

export default router;
