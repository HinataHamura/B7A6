import SSLCommerzPayment from 'sslcommerz-lts';
import { config } from '../config/index.js';

const sslcz = new SSLCommerzPayment(
  config.sslcommerz.storeId || '',
  config.sslcommerz.storePassword || '',
  config.sslcommerz.isLive,
);

interface IInitPaymentParams {
  amount: number;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export const initSSLCommerzPayment = async (params: IInitPaymentParams) => {
  const data = {
    total_amount: params.amount,
    currency: 'BDT',
    tran_id: params.transactionId,
    success_url: `${config.serverUrl}/api/v1/payments/success/${params.transactionId}`,
    fail_url: `${config.serverUrl}/api/v1/payments/fail/${params.transactionId}`,
    cancel_url: `${config.serverUrl}/api/v1/payments/cancel/${params.transactionId}`,
    ipn_url: `${config.serverUrl}/api/v1/payments/ipn`,
    shipping_method: 'No',
    product_name: 'Housing Booking Payment',
    product_category: 'Housing',
    product_profile: 'general',
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_phone: params.customerPhone,
    cus_add1: 'N/A',
    cus_city: 'N/A',
    cus_country: 'Bangladesh',
    ship_name: 'N/A',
    ship_add1: 'N/A',
    ship_city: 'N/A',
    ship_country: 'N/A',
    ship_postcode: '0000',
  };

  const apiResponse = await sslcz.init(data);
  return apiResponse as { GatewayPageURL?: string; status: string };
};

export const validateSSLCommerzPayment = async (valId: string) => {
  const response = await sslcz.validate({ val_id: valId });
  return response as { status: string; tran_id: string; amount: string };
};
