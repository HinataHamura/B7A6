import status from 'http-status';
import type { UserStatus } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';

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

const updateUserStatus = async (userId: string, nextStatus: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Cannot change status of an admin account');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status: nextStatus },
  });
};

const verifyLandlord = async (landlordProfileId: string) => {
  const landlord = await prisma.landlordProfile.findUnique({ where: { id: landlordProfileId } });

  if (!landlord) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  return prisma.landlordProfile.update({
    where: { id: landlordProfileId },
    data: { isVerifiedHost: true },
  });
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
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'PUBLISHED' } }),
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

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  verifyLandlord,
  getDashboardStats,
};
