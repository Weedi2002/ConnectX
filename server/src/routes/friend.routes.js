import { Router } from 'express';
import * as ctrl from '../controllers/friend.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { friendRequestSchema, blockUserSchema } from '../validators/chat.validator.js';

const router = Router();

router.use(protect);
router.get('/', ctrl.listIncoming);
router.get('/sent', ctrl.listSent);
router.get('/friends', ctrl.listFriends);
router.get('/blocked', ctrl.listBlocked);
router.post('/', validate(friendRequestSchema), ctrl.sendRequest);
router.post('/:id/accept', ctrl.acceptRequest);
router.post('/:id/reject', ctrl.rejectRequest);
router.delete('/:id', ctrl.cancelRequest);
router.post('/block', validate(blockUserSchema), ctrl.blockUser);
router.delete('/block/:id', ctrl.unblockUser);

export default router;
