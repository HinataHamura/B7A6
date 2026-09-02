import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { calculateCompatibilityScore } from './roommate.matching.js';

const MIN_MATCH_SCORE = 30;

const findMatches = async (tenantUserId: string) => {
  const me = await prisma.tenantProfile.findUnique({ where: { userId: tenantUserId } });
  if (!me) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  const others = await prisma.tenantProfile.findMany({
    where: { userId: { not: tenantUserId } },
  });

  const scored = others
    .map((other) => ({
      tenant: {
        id: other.id,
        name: other.name,
        profilePhoto: other.profilePhoto,
        bio: other.bio,
        occupation: other.occupation,
        gender: other.gender,
        sleepSchedule: other.sleepSchedule,
        cleanliness: other.cleanliness,
        budgetMin: other.budgetMin,
        budgetMax: other.budgetMax,
        preferredAreas: other.preferredAreas,
      },
      matchScore: calculateCompatibilityScore(me, other),
    }))
    .filter((entry) => entry.matchScore >= MIN_MATCH_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored;
};

const sendRequest = async (
  senderUserId: string,
  payload: { receiverId: string; listingId?: string; message?: string },
) => {
  const sender = await prisma.tenantProfile.findUnique({ where: { userId: senderUserId } });
  if (!sender) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  if (sender.id === payload.receiverId) {
    throw new AppError(status.BAD_REQUEST, 'You cannot send a roommate request to yourself');
  }

  const receiver = await prisma.tenantProfile.findUnique({ where: { id: payload.receiverId } });
  if (!receiver) {
    throw new AppError(status.NOT_FOUND, 'Receiver tenant profile not found');
  }

  const existing = await prisma.roommateRequest.findFirst({
    where: {
      senderId: sender.id,
      receiverId: receiver.id,
      listingId: payload.listingId ?? null,
      status: 'PENDING',
    },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, 'A pending request already exists');
  }

  const matchScore = calculateCompatibilityScore(sender, receiver);

  return prisma.roommateRequest.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      listingId: payload.listingId,
      message: payload.message,
      matchScore,
    },
  });
};

const respondToRequest = async (
  requestId: string,
  tenantUserId: string,
  nextStatus: 'ACCEPTED' | 'DECLINED',
) => {
  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
    include: { receiver: true },
  });

  if (!request) {
    throw new AppError(status.NOT_FOUND, 'Roommate request not found');
  }

  if (request.receiver.userId !== tenantUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only respond to requests sent to you');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(status.BAD_REQUEST, 'This request has already been responded to');
  }

  return prisma.roommateRequest.update({
    where: { id: requestId },
    data: { status: nextStatus },
  });
};

const cancelRequest = async (requestId: string, tenantUserId: string) => {
  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
    include: { sender: true },
  });

  if (!request) {
    throw new AppError(status.NOT_FOUND, 'Roommate request not found');
  }

  if (request.sender.userId !== tenantUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only cancel your own requests');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(status.BAD_REQUEST, 'Only pending requests can be cancelled');
  }

  return prisma.roommateRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  });
};

const getSentRequests = async (tenantUserId: string) => {
  const tenant = await prisma.tenantProfile.findUnique({ where: { userId: tenantUserId } });
  if (!tenant) throw new AppError(status.NOT_FOUND, 'Tenant profile not found');

  return prisma.roommateRequest.findMany({
    where: { senderId: tenant.id },
    include: { receiver: true, listing: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getReceivedRequests = async (tenantUserId: string) => {
  const tenant = await prisma.tenantProfile.findUnique({ where: { userId: tenantUserId } });
  if (!tenant) throw new AppError(status.NOT_FOUND, 'Tenant profile not found');

  return prisma.roommateRequest.findMany({
    where: { receiverId: tenant.id },
    include: { sender: true, listing: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const RoommateService = {
  findMatches,
  sendRequest,
  respondToRequest,
  cancelRequest,
  getSentRequests,
  getReceivedRequests,
};
