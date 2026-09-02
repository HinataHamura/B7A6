import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { BookingService } from './booking.service.js';

const createBooking = catchAsync(async (req, res) => {
  const result = await BookingService.createBooking(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: 'Booking request created successfully',
    data: result,
  });
});

const getMyBookingsAsTenant = catchAsync(async (req, res) => {
  const result = await BookingService.getMyBookingsAsTenant(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Your bookings retrieved successfully',
    data: result,
  });
});

const getMyBookingsAsLandlord = catchAsync(async (req, res) => {
  const result = await BookingService.getMyBookingsAsLandlord(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Bookings for your listings retrieved successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const result = await BookingService.getBookingById(
    req.params.id as string,
    req.user!.id,
    req.user!.role,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const result = await BookingService.updateBookingStatus(
    req.params.id as string,
    req.user!.id,
    req.user!.role,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getMyBookingsAsTenant,
  getMyBookingsAsLandlord,
  getBookingById,
  updateBookingStatus,
};
