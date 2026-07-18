import { Router } from 'express';
import * as ctrl from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  sendMessageSchema,
  editMessageSchema,
  reactMessageSchema,
  forwardMessageSchema,
} from '../validators/chat.validator.js';

const router = Router();

router.use(protect);
router.get('/bookmarks/all', ctrl.getBookmarks);
router.get('/:chatId', ctrl.getMessages);
router.get('/:chatId/pinned', ctrl.getPinned);
router.post('/', validate(sendMessageSchema), ctrl.sendMessage);
router.patch('/:chatId/read', ctrl.markRead);
router.patch('/:id', validate(editMessageSchema), ctrl.editMessage);
router.post('/:id/react', validate(reactMessageSchema), ctrl.reactMessage);
router.post('/:id/pin', ctrl.pinMessage);
router.post('/:id/bookmark', ctrl.bookmarkMessage);
router.post('/:id/forward', validate(forwardMessageSchema), ctrl.forwardMessage);
router.delete('/:id', ctrl.deleteMessage);

export default router;
