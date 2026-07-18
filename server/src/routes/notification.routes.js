import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', ctrl.getNotifications);
router.get('/unread', ctrl.getUnreadCounts);
router.patch('/read/:id', ctrl.markRead);
router.patch('/read', ctrl.markRead);
router.delete('/', ctrl.clearNotifications);

export default router;
