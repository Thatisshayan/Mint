import { FastifyInstance, FastifyReply } from 'fastify';
import { sendMagicLink, verifyMagicLink } from '../services/auth.service.js';
import { z } from 'zod';

const sendMagicLinkSchema = z.object({ body: z.object({ email: z.string().email() }) });
const verifyMagicLinkSchema = z.object({ body: z.object({ token: z.string().min(1) }) });

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/magic-link', async (request, reply: FastifyReply) => {
    const parsed = sendMagicLinkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }
    const { email } = parsed.data.body;
    return sendMagicLink(email);
  });

  fastify.post('/verify', async (request, reply: FastifyReply) => {
    const parsed = verifyMagicLinkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }
    const { token } = parsed.data.body;
    return verifyMagicLink(token);
  });
}
