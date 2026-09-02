import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AdminService } from './admin.service.js';

const getAllUsers = catchAsync(async (_req, res) => {
  const result = await AdminService.getAllUsers();

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const result = await AdminService.updateUserStatus(req.params.id as string, req.body.status);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'User status updated successfully',
    data: result,
  });
});

const verifyLandlord = catchAsync(async (req, res) => {
  const result = await AdminService.verifyLandlord(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Landlord verified successfully',
    data: result,
  });
});

const getDashboardStats = catchAsync(async (_req, res) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  verifyLandlord,
  getDashboardStats,
};
