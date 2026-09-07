import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { parsePagination } from '../../utils/pagination.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { renderPaymentResultPage } from './payment.page.js';
import { PaymentService } from './payment.service.js';

const initiatePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.initiatePayment(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Payment session created successfully',
    data: result,
  });
});

const paymentSuccess = catchAsync(async (req, res) => {
  const transactionId = req.params.tranId as string;
  const valId = (req.body?.val_id || req.query?.val_id) as string;

  await PaymentService.handlePaymentSuccess(transactionId, valId);

  res.status(status.OK).send(renderPaymentResultPage('success', transactionId));
});

const paymentFail = catchAsync(async (req, res) => {
  const transactionId = req.params.tranId as string;
  await PaymentService.handlePaymentFailOrCancel(transactionId, 'FAILED');

  res.status(status.OK).send(renderPaymentResultPage('fail', transactionId));
});

const paymentCancel = catchAsync(async (req, res) => {
  const transactionId = req.params.tranId as string;
  await PaymentService.handlePaymentFailOrCancel(transactionId, 'CANCELLED');

  res.status(status.OK).send(renderPaymentResultPage('cancel', transactionId));
});

const paymentIPN = catchAsync(async (req, res) => {
  const { tran_id, val_id } = req.body;

  if (tran_id && val_id) {
    await PaymentService.handlePaymentSuccess(tran_id, val_id);
  }

  res.status(200).send('IPN received');
});

const getPaymentHistory = catchAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const result = await PaymentService.getPaymentHistory(req.user!.id, req.user!.role, {
    page,
    limit,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Payment history retrieved successfully',
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
    data: result.data,
  });
});

export const PaymentController = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
  getPaymentHistory,
};
