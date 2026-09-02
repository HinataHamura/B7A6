import type { PaymentPurpose } from '../../../generated/prisma/index.js';

export interface IInitiatePaymentPayload {
  bookingId: string;
  purpose: PaymentPurpose;
}

export interface ISSLCommerzIPNPayload {
  tran_id: string;
  status: string;
  amount: string;
  card_type?: string;
  bank_tran_id?: string;
  val_id: string;
}
