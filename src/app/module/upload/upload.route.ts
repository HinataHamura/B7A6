import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { upload } from '../../middleware/upload.js';
import { UploadController } from './upload.controller.js';

const router = Router();

router.post(
  '/images',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  upload.array('images', 10),
  UploadController.uploadImages,
);

export const uploadRoutes = router;
