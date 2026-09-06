import status from 'http-status';
import type { Prisma, Role } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';

const updateTenantProfile = async (userId: string, payload: Record<string, unknown>) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  return prisma.tenantProfile.update({
    where: { userId },
    data: payload as Prisma.TenantProfileUncheckedUpdateInput,
  });
};

const updateLandlordProfile = async (userId: string, payload: Record<string, unknown>) => {
  const landlordProfile = await prisma.landlordProfile.findUnique({ where: { userId } });

  if (!landlordProfile) {
    throw new AppError(status.NOT_FOUND, 'Landlord profile not found');
  }

  return prisma.landlordProfile.update({
    where: { userId },
    data: payload as Prisma.LandlordProfileUncheckedUpdateInput,
  });
};

const submitTenantVerification = async (userId: string, documentUrl: string) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  if (tenantProfile.verificationStatus === 'PENDING') {
    throw new AppError(status.CONFLICT, 'Verification is already pending review');
  }

  return prisma.tenantProfile.update({
    where: { userId },
    data: {
      verificationDocumentUrl: documentUrl,
      verificationStatus: 'PENDING',
    },
  });
};

const reviewTenantVerification = async (
  actorId: string,
  actorRole: Role,
  tenantProfileId: string,
  approve: boolean,
) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { id: tenantProfileId },
  });

  if (!tenantProfile) {
    throw new AppError(status.NOT_FOUND, 'Tenant profile not found');
  }

  if (tenantProfile.verificationStatus !== 'PENDING') {
    throw new AppError(status.BAD_REQUEST, 'This tenant has no pending verification request');
  }

  const updated = await prisma.tenantProfile.update({
    where: { id: tenantProfileId },
    data: {
      verificationStatus: approve ? 'APPROVED' : 'REJECTED',
      isVerifiedTenant: approve,
    },
  });

  await NotificationService.createNotification(
    tenantProfile.userId,
    'SYSTEM',
    'Verification update',
    approve
      ? 'Your identity verification has been approved'
      : 'Your identity verification was rejected. Please resubmit a valid document.',
    { tenantProfileId },
  );

  await AuditService.createAuditLog({
    actorId,
    actorRole,
    action: approve ? 'TENANT_VERIFICATION_APPROVED' : 'TENANT_VERIFICATION_REJECTED',
    entityType: 'TenantProfile',
    entityId: tenantProfileId,
  });

  return updated;
};

export const UserService = {
  updateTenantProfile,
  updateLandlordProfile,
  submitTenantVerification,
  reviewTenantVerification,
};
