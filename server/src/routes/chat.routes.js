import { Router } from 'express';
import * as ctrl from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  createChatSchema,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  chatSettingSchema,
  recentSearchSchema,
} from '../validators/chat.validator.js';

const router = Router();

router.use(protect);
router.get('/', ctrl.getChats);
router.post('/', validate(createChatSchema), ctrl.createOrGetChat);

router.get('/settings', ctrl.getChatSettings);
router.put('/:id/settings/:key', validate(chatSettingSchema), ctrl.updateChatSetting);

router.get('/search', ctrl.search);
router.get('/search/recent', ctrl.getRecentSearches);
router.post('/search/recent', validate(recentSearchSchema), ctrl.addRecentSearch);
router.delete('/search/recent', ctrl.clearRecentSearches);

router.post('/group', validate(createGroupSchema), ctrl.createGroup);
router.put('/group/:id', validate(updateGroupSchema), ctrl.updateGroup);
router.put('/group/:id/avatar', upload.single('avatar'), ctrl.updateGroupAvatar);
router.post('/group/:id/members', validate(addMembersSchema), ctrl.addMembers);
router.delete('/group/:id/members/:userId', ctrl.removeMember);
router.post('/group/:id/leave', ctrl.leaveGroup);
router.put('/group/:id/admins/:userId', ctrl.promoteAdmin);
router.delete('/group/:id/admins/:userId', ctrl.demoteAdmin);

export default router;
