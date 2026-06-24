const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workspaces = await prisma.workspace.findMany();
  console.log("Workspaces in DB:", workspaces);

  const projects = await prisma.project.findMany();
  console.log("Projects in DB:", projects);
}

main().finally(() => prisma.$disconnect());
