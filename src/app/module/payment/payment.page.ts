type PaymentOutcome = 'success' | 'fail' | 'cancel';

const OUTCOME_CONFIG: Record<
  PaymentOutcome,
  { title: string; message: string; color: string; icon: string }
> = {
  success: {
    title: 'Payment Successful',
    message: 'Your payment has been verified and recorded.',
    color: '#16a34a',
    icon: '&#10003;',
  },
  fail: {
    title: 'Payment Failed',
    message: 'The payment could not be completed. No amount has been charged.',
    color: '#dc2626',
    icon: '&#10007;',
  },
  cancel: {
    title: 'Payment Cancelled',
    message: 'You cancelled the payment. No amount has been charged.',
    color: '#d97706',
    icon: '&#8213;',
  },
};

export const renderPaymentResultPage = (outcome: PaymentOutcome, transactionId: string) => {
  const { title, message, color, icon } = OUTCOME_CONFIG[outcome];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — Roomly</title>
  </head>
  <body style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;">
    <div style="background:#fff;border-radius:16px;padding:48px 40px;max-width:460px;width:calc(100% - 32px);box-shadow:0 10px 40px rgba(15,23,42,0.08);text-align:center;">
      <div style="width:72px;height:72px;border-radius:50%;background:${color};color:#fff;font-size:38px;line-height:72px;margin:0 auto 24px;">${icon}</div>
      <h1 style="margin:0 0 12px;font-size:24px;color:#0f172a;">${title}</h1>
      <p style="margin:0 0 28px;color:#475569;line-height:1.6;">${message}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;text-align:left;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:6px;">Transaction ID</div>
        <code style="font-size:13px;color:#0f172a;word-break:break-all;">${transactionId}</code>
      </div>
      <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;">Roomly — Housing &amp; Roommate Platform</p>
    </div>
  </body>
</html>`;
};
