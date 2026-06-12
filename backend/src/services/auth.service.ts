import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { prisma } from '../services/db.js';
import { sign } from '../utils/jwt.js';
import { z } from 'zod';

const magicLinkSchema = z.object({ email: z.string().email() });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMagicLink(email: string) {
  magicLinkSchema.parse({ email });
  const token = sign({ sub: email, email }, { expiresIn: '1h' });
  const link = `http://localhost:5173/auth/verify?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Sign in to MINT',
    text: `Sign in: ${link}`,
  });
  return { message: 'If that account exists, a magic link has been sent.' };
}

export async function verifyMagicLink(token: string) {
  const payload = (await import('../utils/jwt.js')).verify(token);
  const email = payload.email as string;
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name: email.split('@')[0] } });
  }
  const accessToken = sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });
  return {
    accessToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: user.id, email: user.email, name: user.name ?? undefined },
  };
}
