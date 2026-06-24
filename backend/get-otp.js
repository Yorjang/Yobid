const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'hoangbanggiang04@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found");
  } else {
    console.log(`OTP Code: ${user.otpCode}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
