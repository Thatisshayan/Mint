import { FastifyRequest } from 'fastify';

export function getCurrentUser(request: FastifyRequest): unknown | null {
  return request.user ?? null;
}
