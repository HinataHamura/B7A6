import { randomUUID } from 'node:crypto';
import status from 'http-status';
import { initSSLCommerzPayment, validateSSLCommerzPayment } from '../../lib/sslcommerz.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { NotificationService } from '../notification/notification.service.js';
import type { IInitiatePaymentPayload } from './payment.interface.js';

const initiatePayment = async (tenantUserId: string, payload: IInitiatePaymentPayload) => {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: { tenant: { include: { user: true } }, listing: true },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  if (booking.tenant.userId !== tenantUserId) {
    throw new AppError(status.FORBIDDEN, 'You can only pay for your own booking');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new AppError(status.BAD_REQUEST, 'Booking must be confirmed before payment');
  }

  const existingPaidPayment = await prisma.payment.findFirst({
    where: { bookingId: booking.id, purpose: payload.purpose, status: 'PAID' },
  });

  if (existingPaidPayment) {
    throw new AppError(status.CONFLICT, 'This payment has already been completed');
  }

  const amount =
    payload.purpose === 'BOOKING_ADVANCE'
      ? Number(booking.listing.rentAmount)
      : Number(booking.listing.securityDeposit);

  const transactionId = `ROOMLY-${randomUUID()}`;

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      transactionId,
      purpose: payload.purpose,
      amount,
      status: 'PENDING',
    },
  });

  const gatewayResponse = await initSSLCommerzPayment({
    amount,
    transactionId,
    customerName: booking.tenant.name,
    customerEmail: booking.tenant.user.email,
    customerPhone: booking.tenant.phone || '01700000000',
  });

  if (!gatewayResponse.GatewayPageURL) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to initiate payment gateway session');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayResponse: gatewayResponse as unknown as object },
  });

  return { paymentUrl: gatewayResponse.GatewayPageURL, transactionId };
};

const handlePaymentSuccess = async (transactionId: string, valId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { booking: { include: { tenant: true, listing: true } } },
  });
  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment record not found');
  }

  if (payment.status === 'PAID') {
    return { transactionId, status: 'PAID' };
  }

  const validation = await validateSSLCommerzPayment(valId);

  if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
    throw new AppError(status.BAD_REQUEST, 'Payment validation failed');
  }

  if (validation.tran_id !== transactionId) {
    throw new AppError(status.BAD_REQUEST, 'Transaction id mismatch');
  }

  const validatedAmount = Number(validation.amount);
  const expectedAmount = Number(payment.amount);

  if (Math.abs(validatedAmount - expectedAmount) > 0.01) {
    throw new AppError(status.BAD_REQUEST, 'Payment amount mismatch');
  }

  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: 'PAID' } },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      gatewayResponse: validation as unknown as object,
    },
  });

  if (updated.count === 0) {
    return { transactionId, status: 'PAID' };
  }

  await NotificationService.createNotification(
    payment.booking.tenant.userId,
    'PAYMENT',
    'Payment successful',
    `Your payment for "${payment.booking.listing.title}" was successful`,
    { paymentId: payment.id },
  );

  return { transactionId, status: 'PAID' };
};

const handlePaymentFailOrCancel = async (
  transactionId: string,
  finalStatus: 'FAILED' | 'CANCELLED',
) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment record not found');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: finalStatus },
  });

  return { transactionId, status: finalStatus };
};

const getPaymentHistory = async (userId: string, role: string) => {
  if (role === 'TENANT') {
    return prisma.payment.findMany({
      where: { booking: { tenant: { userId } } },
      include: { booking: { include: { listing: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (role === 'LANDLORD') {
    return prisma.payment.findMany({
      where: { booking: { listing: { landlord: { userId } } } },
      include: { booking: { include: { listing: true, tenant: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.payment.findMany({
    include: { booking: { include: { listing: true, tenant: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const PaymentService = {
  initiatePayment,
  handlePaymentSuccess,
  handlePaymentFailOrCancel,
  getPaymentHistory,
};
