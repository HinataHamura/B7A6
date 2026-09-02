import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';

interface ICreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

const createReview = async (tenantUserId: string, payload: ICreateReviewPayload) => {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: { tenant: true, listing: { include: { landlord: true } }, review: true },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  if (booking.tenant.userId !== tenantUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only review your own bookings');
  }

  if (booking.status !== 'COMPLETED') {
    throw new AppError(status.BAD_REQUEST, 'You can only review a completed stay');
  }

  if (booking.review) {
    throw new AppError(status.CONFLICT, 'You have already reviewed this booking');
  }

  return prisma.review.create({
    data: {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      landlordId: booking.listing.landlordId,
      listingId: booking.listingId,
      rating: payload.rating,
      comment: payload.comment,
      isVerifiedStay: true,
    },
  });
};

const getListingReviews = async (listingId: string) => {
  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { listingId },
      include: { tenant: { select: { name: true, profilePhoto: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.aggregate({
      where: { listingId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    reviews,
    averageRating: aggregate._avg.rating ?? 0,
    totalReviews: aggregate._count.rating,
  };
};

const getLandlordReviews = async (landlordId: string) => {
  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { landlordId },
      include: {
        tenant: { select: { name: true, profilePhoto: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.aggregate({
      where: { landlordId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    reviews,
    averageRating: aggregate._avg.rating ?? 0,
    totalReviews: aggregate._count.rating,
  };
};

export const ReviewService = {
  createReview,
  getListingReviews,
  getLandlordReviews,
};
