import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { UserService } from './user.service.js';

const updateMyProfile = catchAsync(async (req, res) => {
  const result =
    req.user!.role === 'LANDLORD'
      ? await UserService.updateLandlordProfile(req.user!.id, req.body)
      : await UserService.updateTenantProfile(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const submitVerification = catchAsync(async (req, res) => {
  const result = await UserService.submitTenantVerification(req.user!.id, req.body.documentUrl);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Verification document submitted, pending review',
    data: result,
  });
});

const reviewVerification = catchAsync(async (req, res) => {
  const approve = req.body.approve === true;
  const result = await UserService.reviewTenantVerification(
    req.user!.id,
    req.user!.role,
    req.params.tenantProfileId as string,
    approve,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: approve ? 'Tenant verification approved' : 'Tenant verification rejected',
    data: result,
  });
});

export const UserController = {
  updateMyProfile,
  submitVerification,
  reviewVerification,
};
