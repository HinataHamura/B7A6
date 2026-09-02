import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { ReviewController } from './review.controller.js';
import { createReviewValidation } from './review.validation.js';

const router = Router();

router.post(
  '/',
  checkAuth('TENANT'),
  validateRequest(createReviewValidation),
  ReviewController.createReview,
);

router.get('/listing/:listingId', ReviewController.getListingReviews);
router.get('/landlord/:landlordId', ReviewController.getLandlordReviews);

export const reviewRoutes = router;
