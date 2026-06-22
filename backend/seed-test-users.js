const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'admin@taskflow.ai', name: 'System Admin', role: 'ADMIN' },
    { email: 'pm@taskflow.ai', name: 'Project Manager', role: 'PROJECT_MANAGER' },
    { email: 'member@taskflow.ai', name: 'Team Member', role: 'MEMBER' },
  ];

  console.log('Seeding test users...');
  for (const u of users) {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role, name: u.name },
        create: {
          email: u.email,
          password: hashedPassword,
          name: u.name,
          role: u.role,
        },
      });
      console.log(`Created/updated user ${u.email} with role ${u.role}`);
    } catch (err) {
      console.error(`Error for user ${u.email}:`, err.message);
    }
  }
  await prisma.$disconnect();
}

main();
