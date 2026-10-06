import nodemailer from 'nodemailer';

export function getSmtpConfig() {
  const port = Number(process.env.IONOS_SMTP_PORT ?? 465);
  return {
    host: process.env.IONOS_SMTP_HOST ?? 'smtp.ionos.com',
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: process.env.IONOS_EMAIL_USER ?? '', pass: process.env.IONOS_EMAIL_PASSWORD ?? '' },
    tls: { rejectUnauthorized: true },
  };
}

export function createSmtpTransport() {
  const config = getSmtpConfig();
  if (!config.auth.user || !config.auth.pass) throw new Error('IONOS email credentials are not configured');
  return nodemailer.createTransport(config);
}
