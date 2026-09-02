declare module 'sslcommerz-lts' {
  export default class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    validate(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  }
}
