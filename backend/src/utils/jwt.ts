import jwt from '@fastify/jwt';

export const sign = (payload: Record<string, unknown>, options?: { expiresIn?: string }) =>
  jwt.sign(payload, options);

export const verify = (token: string) => jwt.verify<{ sub: string; email: string }>(token);
