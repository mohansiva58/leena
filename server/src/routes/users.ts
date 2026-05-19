import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    getCurrentUser,
    addAddress,
    updateAddress,
    deleteAddress,
} from '../controllers/userController';

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

router.get('/me', getCurrentUser);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
