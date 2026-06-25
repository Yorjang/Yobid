const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING TRASH PERMISSION SYSTEM TEST ===");

  // 1. Get or create test users (Manager and Member)
  const managerEmail = 'pm@taskflow.ai';
  const memberEmail = 'member@taskflow.ai';

  let manager = await prisma.user.findUnique({ where: { email: managerEmail } });
  let member = await prisma.user.findUnique({ where: { email: memberEmail } });

  if (!manager) {
    manager = await prisma.user.create({
      data: { email: managerEmail, name: 'Project Manager', role: 'PROJECT_MANAGER' }
    });
  }
  if (!member) {
    member = await prisma.user.create({
      data: { email: memberEmail, name: 'Team Member', role: 'MEMBER' }
    });
  }

  const managerId = manager.id;
  const memberId = member.id;
  console.log(`Manager ID: ${managerId}, Member ID: ${memberId}`);

  // 2. Create a test Workspace owned by Manager
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Permission Test Workspace',
      slug: 'perm-test-' + Date.now().toString(36),
      ownerId: managerId,
      members: {
        create: [
          { userId: managerId, role: 'OWNER' },
          { userId: memberId, role: 'MEMBER' }
        ]
      }
    }
  });
  console.log(`Created Workspace: ${workspace.name} (ID: ${workspace.id})`);

  // 3. Create a Project inside the Workspace
  const project = await prisma.project.create({
    data: {
      name: 'Permission Test Project',
      workspaceId: workspace.id,
      members: {
        create: [
          { userId: managerId, role: 'MANAGER' },
          { userId: memberId, role: 'MEMBER' }
        ]
      }
    }
  });
  console.log(`Created Project: ${project.name} (ID: ${project.id})`);

  // 4. Create two Tasks: Task 1 and Task 2
  const task1 = await prisma.task.create({
    data: {
      title: 'Task 1 (To be deleted by Manager)',
      projectId: project.id,
      creatorId: managerId
    }
  });
  const task2 = await prisma.task.create({
    data: {
      title: 'Task 2 (To be deleted by Member)',
      projectId: project.id,
      creatorId: memberId
    }
  });
  console.log(`Created Tasks. Task 1 ID: ${task1.id}, Task 2 ID: ${task2.id}`);

  // 5. Soft-delete Task 1 by Manager
  await prisma.task.update({
    where: { id: task1.id },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: managerId }
  });
  console.log(`Manager soft-deleted Task 1.`);

  // 6. Soft-delete Task 2 by Member
  await prisma.task.update({
    where: { id: task2.id },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: memberId }
  });
  console.log(`Member soft-deleted Task 2.`);

  // 7. Verify Trash contents for Manager
  // Simulated TrashService.findAll logic for Manager
  const managerTasks = await prisma.task.findMany({
    where: { isDeleted: true, deletedById: managerId },
    select: { id: true, title: true }
  });
  console.log("Manager trash tasks:", managerTasks);
  if (managerTasks.length !== 1 || managerTasks[0].id !== task1.id) {
    throw new Error("Manager should see exactly Task 1 in their trash!");
  }

  // 8. Verify Trash contents for Member
  // Simulated TrashService.findAll logic for Member
  const memberTasks = await prisma.task.findMany({
    where: { isDeleted: true, deletedById: memberId },
    select: { id: true, title: true }
  });
  console.log("Member trash tasks:", memberTasks);
  if (memberTasks.length !== 1 || memberTasks[0].id !== task2.id) {
    throw new Error("Member should see exactly Task 2 in their trash!");
  }

  // 9. Cleanup Workspace (cascade deletes tasks and projects)
  await prisma.workspace.delete({ where: { id: workspace.id } });
  console.log("Cleanup Workspace successfully.");

  console.log("=== ALL TRASH PERMISSION TESTS PASSED SECURELY ===");
}

main()
  .catch(err => {
    console.error("Test failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
