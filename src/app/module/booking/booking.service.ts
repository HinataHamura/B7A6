import status from 'http-status';
import type { BookingStatus } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { BOOKING_STATUS_TRANSITIONS, type ICreateBookingPayload } from './booking.interface.js';

const createBooking = async (tenantUserId: string, payload: ICreateBookingPayload) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: tenantUserId },
  });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  const listing = await prisma.listing.findUnique({ where: { id: payload.listingId } });

  if (!listing || listing.status !== 'PUBLISHED') {
    throw new AppError(status.NOT_FOUND, 'Listing not available for booking');
  }

  const existingActiveBooking = await prisma.booking.findFirst({
    where: {
      tenantId: tenantProfile.id,
      listingId: payload.listingId,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });

  if (existingActiveBooking) {
    throw new AppError(status.CONFLICT, 'You already have an active booking for this listing');
  }

  return prisma.booking.create({
    data: {
      tenantId: tenantProfile.id,
      listingId: payload.listingId,
      moveInDate: payload.moveInDate,
      message: payload.message,
    },
    include: { listing: true },
  });
};

const getMyBookingsAsTenant = async (tenantUserId: string) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: tenantUserId },
  });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  return prisma.booking.findMany({
    where: { tenantId: tenantProfile.id },
    include: { listing: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getMyBookingsAsLandlord = async (landlordUserId: string) => {
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlordUserId },
  });

  if (!landlordProfile) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  return prisma.booking.findMany({
    where: { listing: { landlordId: landlordProfile.id } },
    include: {
      listing: true,
      tenant: { select: { name: true, phone: true, profilePhoto: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getBookingById = async (id: string, userId: string, role: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { landlord: true } },
      tenant: true,
      payments: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  const isOwnerTenant = booking.tenant.userId === userId;
  const isOwnerLandlord = booking.listing.landlord.userId === userId;

  if (role !== 'ADMIN' && !isOwnerTenant && !isOwnerLandlord) {
    throw new AppError(status.FORBIDDEN, 'You do not have access to this booking');
  }

  return booking;
};

const updateBookingStatus = async (
  id: string,
  userId: string,
  role: string,
  nextStatus: BookingStatus,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { include: { landlord: true } }, tenant: true },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  const isOwnerTenant = booking.tenant.userId === userId;
  const isOwnerLandlord = booking.listing.landlord.userId === userId;

  if (role !== 'ADMIN' && !isOwnerTenant && !isOwnerLandlord) {
    throw new AppError(status.FORBIDDEN, 'You do not have access to this booking');
  }

  if (['CONFIRMED', 'REJECTED'].includes(nextStatus) && !isOwnerLandlord && role !== 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Only the landlord can confirm or reject a booking');
  }

  if (nextStatus === 'COMPLETED' && !isOwnerLandlord && role !== 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Only the landlord can mark a booking as completed');
  }

  const allowedNext = BOOKING_STATUS_TRANSITIONS[booking.status];
  if (!allowedNext.includes(nextStatus)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot change booking status from ${booking.status} to ${nextStatus}`,
    );
  }

  return prisma.booking.update({
    where: { id },
    data: { status: nextStatus },
  });
};

export const BookingService = {
  createBooking,
  getMyBookingsAsTenant,
  getMyBookingsAsLandlord,
  getBookingById,
  updateBookingStatus,
};
