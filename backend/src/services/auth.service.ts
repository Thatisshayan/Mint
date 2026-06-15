import { prisma } from './db.js';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { sign } from '../utils/jwt.js';

const magicLinkSchema = z.object({ email: z.string().email() });
const verifyMagicLinkSchema = z.object({ token: z.string().min(1) });

function extractEmailFromMagicLink(token: string) {
  if (!token.startsWith('dev-')) throw new Error('Invalid magic link token');
  const email = token.slice(4).trim();
  if (!email) throw new Error('Invalid magic link token');
  return email;
}

async function resolveUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}

export async function sendMagicLink(email: string) {
  magicLinkSchema.parse({ email });
  const token = `dev-${email}`;
  const link = `http://localhost:5173/auth/verify?token=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_PORT) === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const hasMailConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (hasMailConfig) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'Sign in to MINT',
      text: `Sign in link: ${link}`,
    });
  }

  return { message: 'Magic link sent.' };
}

export async function verifyMagicLink(token: string) {
  verifyMagicLinkSchema.parse({ token });
  const email = extractEmailFromMagicLink(token);
  const user = await resolveUser(email);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const accessToken = sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });
  return {
    accessToken,
    expiresAt,
    user: { id: user.id, email: user.email, name: email.split('@')[0] },
  };
}
