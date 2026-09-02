import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ReviewService } from './review.service.js';

const createReview = catchAsync(async (req, res) => {
  const result = await ReviewService.createReview(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: 'Review submitted successfully',
    data: result,
  });
});

const getListingReviews = catchAsync(async (req, res) => {
  const result = await ReviewService.getListingReviews(req.params.listingId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Listing reviews retrieved successfully',
    data: result,
  });
});

const getLandlordReviews = catchAsync(async (req, res) => {
  const result = await ReviewService.getLandlordReviews(req.params.landlordId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Landlord reviews retrieved successfully',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getListingReviews,
  getLandlordReviews,
};
