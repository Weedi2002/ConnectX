import { Router } from 'express';
import * as ctrl from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/', protect, upload.array('files', 5), ctrl.uploadFiles);

export default router;
