import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const isConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  : null;

interface ISendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: ISendEmailPayload): Promise<void> => {
  if (!transporter) {
    console.warn(`SMTP not configured — skipping email to ${payload.to}: "${payload.subject}"`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (error) {
    console.error(`Failed to send email to ${payload.to}:`, error);
  }
};
