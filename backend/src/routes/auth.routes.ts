import { Router } from 'fastify';
import { sendMagicLink, verifyMagicLink } from '../services/auth.service.js';
import { z } from 'zod';

const sendMagicLinkSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

const verifyMagicLinkSchema = z.object({
  body: z.object({ token: z.string().min(1) }),
});

export const authRoutes = new Router<{ prefix?: string }>();

authRoutes.post('/magic-link', async (request, reply) => {
  const result = sendMagicLinkSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ message: result.error.message });
  }
  const { email } = result.data.body;
  return sendMagicLink(email);
});

authRoutes.post('/verify', async (request, reply) => {
  const result = verifyMagicLinkSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ message: result.error.message });
  }
  const { token } = result.data.body;
  return verifyMagicLink(token);
});
