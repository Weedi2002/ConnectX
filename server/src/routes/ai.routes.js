import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { smartReplySchema, summarizeSchema, translateSchema } from '../validators/ai.validator.js';

const router = Router();

router.use(protect);
router.post('/smart-reply', validate(smartReplySchema), ctrl.smartReply);
router.post('/summarize', validate(summarizeSchema), ctrl.summarize);
router.post('/translate', validate(translateSchema), ctrl.translate);

export default router;
