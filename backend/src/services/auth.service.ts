import nodemailer from 'nodemailer';
import { z } from 'zod';

export const sendMagicLinkInputSchema = z.object({ email: z.string().email() });

export async function sendMagicLink(email: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const token = `dev-${email}`;
  const link = `http://localhost:5173/auth/verify?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Sign in to MINT',
    text: `Sign in link: ${link}`,
  });

  return { message: 'If that account exists, a magic link has been sent.' };
}

export async function verifyMagicLink(token: string) {
  const email = token.startsWith('dev-') ? token.slice(4) : '';
  if (!email) {
    throw new Error('Invalid magic link token');
  }

  const accessToken = `dev-access-${email}`;
  const now = new Date();

  return {
    accessToken,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: email,
      email,
      name: email.split('@')[0] ?? undefined,
    },
  };
}
