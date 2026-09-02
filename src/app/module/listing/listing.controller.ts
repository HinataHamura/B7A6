import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { pick } from '../../utils/pick.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { listingFilterableFields } from './listing.constant.js';
import { ListingService } from './listing.service.js';

const createListing = catchAsync(async (req, res) => {
  const result = await ListingService.createListing(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: 'Listing created successfully',
    data: result,
  });
});

const getAllListings = catchAsync(async (req, res) => {
  const filters = pick(req.query, listingFilterableFields as any);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await ListingService.getAllListings(filters as any, { page, limit });

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Listings retrieved successfully',
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
    data: result.data,
  });
});

const getNearbyListings = catchAsync(async (req, res) => {
  const { latitude, longitude, radiusKm } = req.query;

  const result = await ListingService.getNearbyListings(
    Number(latitude),
    Number(longitude),
    radiusKm ? Number(radiusKm) : undefined,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Nearby listings retrieved successfully',
    data: result,
  });
});

const getListingById = catchAsync(async (req, res) => {
  const result = await ListingService.getListingById(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Listing retrieved successfully',
    data: result,
  });
});

const updateListing = catchAsync(async (req, res) => {
  const result = await ListingService.updateListing(
    req.params.id as string,
    req.user!.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Listing updated successfully',
    data: result,
  });
});

const deleteListing = catchAsync(async (req, res) => {
  await ListingService.deleteListing(req.params.id as string, req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Listing deleted successfully',
    data: null,
  });
});

const getMyListings = catchAsync(async (req, res) => {
  const result = await ListingService.getMyListings(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Your listings retrieved successfully',
    data: result,
  });
});

const toggleSaveListing = catchAsync(async (req, res) => {
  const result = await ListingService.toggleSaveListing(req.user!.id, req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.saved ? 'Listing saved' : 'Listing removed from saved',
    data: result,
  });
});

export const ListingController = {
  createListing,
  getAllListings,
  getNearbyListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  toggleSaveListing,
};
