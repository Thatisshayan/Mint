import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient | null = null;

export const db = {
  get client() {
    if (!_prisma) _prisma = new PrismaClient();
    return _prisma;
  },
};

export const prisma = db.client;
