import type { Role } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';

interface ICreateAuditLogPayload {
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

const createAuditLog = async (payload: ICreateAuditLogPayload) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata as object,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

const getAuditLogs = async (paginationOptions: { page: number; limit: number }) => {
  const { page, limit } = paginationOptions;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count(),
  ]);

  return { data, total, page, limit };
};

export const AuditService = {
  createAuditLog,
  getAuditLogs,
};
