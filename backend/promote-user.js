const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.error('Usage: node promote-user.js <email> <role>');
    process.exit(1);
  }

  console.log(`Promoting ${email} to system role ${role}...`);
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role },
    });
    console.log('Successfully updated user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error('Failed to promote user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
