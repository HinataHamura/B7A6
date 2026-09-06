import status from 'http-status';
import type { Role, UserStatus } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { AuditService } from '../audit/audit.service.js';

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      provider: true,
      createdAt: true,
      landlordProfile: { select: { name: true, isVerifiedHost: true } },
      tenantProfile: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateUserStatus = async (
  actorId: string,
  actorRole: Role,
  userId: string,
  nextStatus: UserStatus,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Cannot change status of an admin account');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: nextStatus },
  });

  await AuditService.createAuditLog({
    actorId,
    actorRole,
    action: 'USER_STATUS_UPDATED',
    entityType: 'User',
    entityId: userId,
    metadata: { previousStatus: user.status, newStatus: nextStatus },
  });

  return updated;
};

const verifyLandlord = async (actorId: string, actorRole: Role, landlordProfileId: string) => {
  const landlord = await prisma.landlordProfile.findUnique({ where: { id: landlordProfileId } });

  if (!landlord) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  const updated = await prisma.landlordProfile.update({
    where: { id: landlordProfileId },
    data: { isVerifiedHost: true },
  });

  await AuditService.createAuditLog({
    actorId,
    actorRole,
    action: 'LANDLORD_VERIFIED',
    entityType: 'LandlordProfile',
    entityId: landlordProfileId,
  });

  return updated;
};

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalLandlords,
    totalTenants,
    totalListings,
    publishedListings,
    totalBookings,
    activeBookings,
    totalPaymentsAgg,
    totalReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.landlordProfile.count(),
    prisma.tenantProfile.count(),
    prisma.listing.count({ where: { deletedAt: null } }),
    prisma.listing.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.review.count(),
  ]);

  return {
    totalUsers,
    totalLandlords,
    totalTenants,
    totalListings,
    publishedListings,
    totalBookings,
    activeBookings,
    totalRevenue: totalPaymentsAgg._sum.amount ?? 0,
    totalReviews,
  };
};

const getAuditLogs = async (paginationOptions: { page: number; limit: number }) => {
  return AuditService.getAuditLogs(paginationOptions);
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  verifyLandlord,
  getDashboardStats,
  getAuditLogs,
};
