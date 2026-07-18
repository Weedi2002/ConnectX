import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { updateProfileSchema } from '../validators/chat.validator.js';

const router = Router();

router.use(protect);
router.get('/', ctrl.searchUsers);
router.get('/:id', ctrl.getUserProfile);
router.put('/profile', validate(updateProfileSchema), ctrl.updateProfile);
router.put('/avatar', upload.single('avatar'), ctrl.updateAvatar);

export default router;
