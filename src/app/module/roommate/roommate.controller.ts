import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { RoommateService } from './roommate.service.js';

const findMatches = catchAsync(async (req, res) => {
  const result = await RoommateService.findMatches(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Compatible roommates retrieved successfully',
    data: result,
  });
});

const sendRequest = catchAsync(async (req, res) => {
  const result = await RoommateService.sendRequest(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: 'Roommate request sent successfully',
    data: result,
  });
});

const respondToRequest = catchAsync(async (req, res) => {
  const result = await RoommateService.respondToRequest(
    req.params.id as string,
    req.user!.id,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Roommate request updated successfully',
    data: result,
  });
});

const cancelRequest = catchAsync(async (req, res) => {
  const result = await RoommateService.cancelRequest(req.params.id as string, req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Roommate request cancelled successfully',
    data: result,
  });
});

const getSentRequests = catchAsync(async (req, res) => {
  const result = await RoommateService.getSentRequests(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Sent requests retrieved successfully',
    data: result,
  });
});

const getReceivedRequests = catchAsync(async (req, res) => {
  const result = await RoommateService.getReceivedRequests(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Received requests retrieved successfully',
    data: result,
  });
});

export const RoommateController = {
  findMatches,
  sendRequest,
  respondToRequest,
  cancelRequest,
  getSentRequests,
  getReceivedRequests,
};
