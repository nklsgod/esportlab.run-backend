import { FastifyInstance } from 'fastify';

export class ScheduleService {
  constructor(private server: FastifyInstance) {}

  async getTeamSchedule(teamId: string, userId: string) {
    // Check if user is member of the team
    const membership = await this.server.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return this.server.prisma.trainingSlot.findMany({
      where: { teamId },
      orderBy: { date: 'asc' },
    });
  }

  async computeSchedule(teamId: string, userId: string) {
    // Check if user is coach or owner
    const membership = await this.server.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: {
        team: {
          select: {
            ownerId: true,
            preferences: true,
          },
        },
      },
    });

    if (!membership || (!membership.isCoach && membership.team.ownerId !== userId)) {
      throw new Error('Only coaches and team owners can compute schedules');
    }

    // For now, return dummy schedule computation
    // This would contain the actual scheduling algorithm
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const slots = [
      {
        date: nextWeek,
        duration: 120,
        players: 5,
        feasibility: 0.85,
      },
    ];

    return { slots, message: 'Schedule computed successfully' };
  }

  async getNextTrainingSlot(teamId: string, userId: string) {
    // Check if user is member of the team
    const membership = await this.server.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const now = new Date();
    
    return this.server.prisma.trainingSlot.findFirst({
      where: { 
        teamId,
        date: {
          gte: now,
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}