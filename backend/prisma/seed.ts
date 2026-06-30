import { prisma } from '../src/services/db.js';

async function main() {
  // Create a default user for single‑user mode if it doesn't exist
  const email = process.env.SEED_USER_EMAIL ?? 'me@local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: 'Local User',
        // No password hash needed for magic‑link mode
      },
    });
    console.log('✅ Seeded default user');
  } else {
    console.log('ℹ️ Default user already exists');
  }
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
