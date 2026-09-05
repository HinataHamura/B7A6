const wrapper = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 24px; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: #0f172a; padding: 20px 24px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Roomly</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">${title}</h2>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; background: #f8fafc; color: #94a3b8; font-size: 12px;">
          This is an automated message from Roomly. Please do not reply.
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const welcomeEmailTemplate = (name: string, role: string) =>
  wrapper(
    `Welcome to Roomly, ${name}!`,
    `<p style="color:#334155;line-height:1.6;">
      Your account has been created successfully as a <strong>${role}</strong>.
      ${
        role === 'TENANT'
          ? 'Start exploring listings and finding your ideal roommate today.'
          : 'Start listing your properties and connect with tenants today.'
      }
    </p>`,
  );

export const bookingStatusEmailTemplate = (
  tenantName: string,
  listingTitle: string,
  status: string,
) =>
  wrapper(
    'Booking Status Update',
    `<p style="color:#334155;line-height:1.6;">
      Hi ${tenantName}, your booking for <strong>"${listingTitle}"</strong> is now
      <strong style="color:#0f172a;">${status}</strong>.
    </p>`,
  );

export const paymentReceiptEmailTemplate = (
  tenantName: string,
  listingTitle: string,
  amount: number,
  transactionId: string,
) =>
  wrapper(
    'Payment Receipt',
    `<p style="color:#334155;line-height:1.6;">
      Hi ${tenantName}, we've received your payment of <strong>BDT ${amount.toFixed(2)}</strong>
      for <strong>"${listingTitle}"</strong>.
    </p>
    <p style="color:#64748b;font-size:13px;">Transaction ID: ${transactionId}</p>`,
  );
