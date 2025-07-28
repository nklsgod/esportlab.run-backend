import { PrismaClient, Role, Weekday } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { discordId: '123456789012345678' },
    update: {},
    create: {
      discordId: '123456789012345678',
      username: 'TestUser1',
      discriminator: '0001',
      avatarHash: 'a1b2c3d4e5f6',
      email: 'testuser1@example.com',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { discordId: '987654321098765432' },
    update: {},
    create: {
      discordId: '987654321098765432',
      username: 'TestUser2',
      discriminator: '0002',
      avatarHash: 'f6e5d4c3b2a1',
      email: 'testuser2@example.com',
    },
  });

  // Create test team
  const team = await prisma.team.upsert({
    where: { joinCode: 'TEST123' },
    update: {},
    create: {
      name: 'Test Team',
      ownerId: user1.id,
      joinCode: 'TEST123',
    },
  });

  // Create team members
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user1.id,
      role: Role.DUELLIST,
      isCoach: true,
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user2.id,
      role: Role.CONTROLLER,
      isCoach: false,
    },
  });

  // Create team preferences
  await prisma.teamPreference.upsert({
    where: { teamId: team.id },
    update: {},
    create: {
      teamId: team.id,
      daysPerWeek: 3,
      hoursPerWeek: 6,
      minSlotMinutes: 90,
      maxSlotMinutes: 180,
    },
  });

  // Create availability
  await prisma.availability.create({
    data: {
      teamId: team.id,
      userId: user1.id,
      weekday: Weekday.MON,
      startTime: 18 * 60, // 18:00
      endTime: 22 * 60,   // 22:00
      priority: 1,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });