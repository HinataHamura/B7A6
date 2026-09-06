import status from 'http-status';
import type { Prisma, Role } from '../../../generated/prisma/index.js';
import { AuditService } from '../audit/audit.service.js';
import { prisma } from '../../lib/prisma.js';
import { getCache, invalidateCacheByPrefix, setCache } from '../../lib/redis.js';
import { AppError } from '../../utils/AppError.js';
import { haversineDistanceKm } from '../../utils/distance.js';
import { listingSearchableFields } from './listing.constant.js';

const LISTING_CACHE_PREFIX = 'listings:';

interface IListingFilters {
  searchTerm?: string;
  city?: string;
  area?: string;
  type?: string;
  status?: string;
  genderPreference?: string;
  minRent?: string;
  maxRent?: string;
  bedrooms?: string;
}

const createListing = async (landlordUserId: string, payload: Record<string, unknown>) => {
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlordUserId },
  });

  if (!landlordProfile) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  const listing = await prisma.listing.create({
    data: {
      ...(payload as Prisma.ListingUncheckedCreateInput),
      landlordId: landlordProfile.id,
    },
  });

  await invalidateCacheByPrefix(LISTING_CACHE_PREFIX);

  return listing;
};

const getAllListings = async (
  filters: IListingFilters,
  paginationOptions: { page: number; limit: number },
) => {
  const { searchTerm, minRent, maxRent, bedrooms, ...restFilters } = filters;
  const { page, limit } = paginationOptions;
  const skip = (page - 1) * limit;

  const cacheKey = `${LISTING_CACHE_PREFIX}${JSON.stringify({ ...filters, page, limit })}`;
  const cached = await getCache<{ data: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return { data: cached.data, total: cached.total, page, limit };
  }

  const andConditions: Prisma.ListingWhereInput[] = [{ status: 'PUBLISHED', deletedAt: null }];

  if (searchTerm) {
    andConditions.push({
      OR: listingSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      })),
    });
  }

  if (minRent || maxRent) {
    andConditions.push({
      rentAmount: {
        gte: minRent ? Number(minRent) : undefined,
        lte: maxRent ? Number(maxRent) : undefined,
      },
    });
  }

  if (bedrooms) {
    andConditions.push({ bedrooms: Number(bedrooms) });
  }

  Object.entries(restFilters).forEach(([field, value]) => {
    if (value) {
      andConditions.push({ [field]: value });
    }
  });

  const where: Prisma.ListingWhereInput = { AND: andConditions };

  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        landlord: { select: { name: true, profilePhoto: true, isVerifiedHost: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  await setCache(cacheKey, { data, total });

  return { data, total, page, limit };
};

const MAX_RADIUS_KM = 50;
const NEARBY_RESULT_LIMIT = 50;

const getNearbyListings = async (latitude: number, longitude: number, radiusKmInput = 5) => {
  const radiusKm = Math.min(Math.max(radiusKmInput, 0.1), MAX_RADIUS_KM);
  const cacheKey = `${LISTING_CACHE_PREFIX}nearby:${latitude}:${longitude}:${radiusKm}`;
  const cached = await getCache<unknown[]>(cacheKey);
  if (cached) return cached;

  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

  const candidates = await prisma.listing.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
      latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
      longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta },
    },
    include: {
      landlord: { select: { name: true, profilePhoto: true, isVerifiedHost: true } },
    },
  });

  const withinRadius = candidates
    .map((listing) => ({
      ...listing,
      distanceKm: haversineDistanceKm(latitude, longitude, listing.latitude, listing.longitude),
    }))
    .filter((listing) => listing.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, NEARBY_RESULT_LIMIT);

  await setCache(cacheKey, withinRadius, 120);

  return withinRadius;
};

const getListingById = async (id: string) => {
  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
          bio: true,
          isVerifiedHost: true,
        },
      },
      reviews: {
        include: { tenant: { select: { name: true, profilePhoto: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  return listing;
};

const updateListing = async (
  id: string,
  landlordUserId: string,
  payload: Record<string, unknown>,
) => {
  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null },
    include: { landlord: true },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  if (listing.landlord.userId !== landlordUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only update your own listings');
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: payload as Prisma.ListingUncheckedUpdateInput,
  });

  await invalidateCacheByPrefix(LISTING_CACHE_PREFIX);

  return updated;
};

const deleteListing = async (id: string, landlordUserId: string, landlordRole: Role) => {
  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null },
    include: { landlord: true },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  if (listing.landlord.userId !== landlordUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only delete your own listings');
  }

  await prisma.listing.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });

  await AuditService.createAuditLog({
    actorId: landlordUserId,
    actorRole: landlordRole,
    action: 'LISTING_SOFT_DELETED',
    entityType: 'Listing',
    entityId: id,
  });

  await invalidateCacheByPrefix(LISTING_CACHE_PREFIX);

  return null;
};

const getMyListings = async (landlordUserId: string) => {
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlordUserId },
  });

  if (!landlordProfile) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  return prisma.listing.findMany({
    where: { landlordId: landlordProfile.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
};

const toggleSaveListing = async (tenantUserId: string, listingId: string) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: tenantUserId },
  });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  const existing = await prisma.savedListing.findUnique({
    where: { tenantId_listingId: { tenantId: tenantProfile.id, listingId } },
  });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.savedListing.create({
    data: { tenantId: tenantProfile.id, listingId },
  });

  return { saved: true };
};

const getLandlordDashboardStats = async (landlordUserId: string) => {
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlordUserId },
  });

  if (!landlordProfile) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  const [
    totalListings,
    publishedListings,
    totalBookings,
    pendingBookings,
    activeBookings,
    totalRevenueAgg,
    averageRatingAgg,
  ] = await Promise.all([
    prisma.listing.count({ where: { landlordId: landlordProfile.id, deletedAt: null } }),
    prisma.listing.count({
      where: { landlordId: landlordProfile.id, status: 'PUBLISHED', deletedAt: null },
    }),
    prisma.booking.count({ where: { listing: { landlordId: landlordProfile.id } } }),
    prisma.booking.count({
      where: { listing: { landlordId: landlordProfile.id }, status: 'PENDING' },
    }),
    prisma.booking.count({
      where: { listing: { landlordId: landlordProfile.id }, status: 'CONFIRMED' },
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID', booking: { listing: { landlordId: landlordProfile.id } } },
      _sum: { amount: true },
    }),
    prisma.review.aggregate({
      where: { landlordId: landlordProfile.id },
      _avg: { rating: true },
    }),
  ]);

  return {
    totalListings,
    publishedListings,
    totalBookings,
    pendingBookings,
    activeBookings,
    totalRevenue: totalRevenueAgg._sum.amount ?? 0,
    averageRating: averageRatingAgg._avg.rating ?? 0,
  };
};

export const ListingService = {
  createListing,
  getAllListings,
  getNearbyListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  toggleSaveListing,
  getLandlordDashboardStats,
};
