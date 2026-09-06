import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { parsePagination } from '../../utils/pagination.js';
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
  const result = await AdminService.updateUserStatus(
    req.user!.id,
    req.user!.role,
    req.params.id as string,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'User status updated successfully',
    data: result,
  });
});

const verifyLandlord = catchAsync(async (req, res) => {
  const result = await AdminService.verifyLandlord(
    req.user!.id,
    req.user!.role,
    req.params.id as string,
  );

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

const getAuditLogs = catchAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const result = await AdminService.getAuditLogs({ page, limit });

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Audit logs retrieved successfully',
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
    data: result.data,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  verifyLandlord,
  getDashboardStats,
  getAuditLogs,
};
