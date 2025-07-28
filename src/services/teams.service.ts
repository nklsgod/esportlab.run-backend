import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';

export class TeamsService {
  constructor(private server: FastifyInstance) {}

  async getUserTeams(userId: string) {
    return this.server.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            discordId: true,
            avatarHash: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discordId: true,
                avatarHash: true,
              },
            },
          },
        },
        preferences: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  async getTeamById(teamId: string, userId: string) {
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
      return null;
    }

    return this.server.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            discordId: true,
            avatarHash: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discordId: true,
                avatarHash: true,
              },
            },
          },
        },
        preferences: true,
      },
    });
  }

  async createTeam(name: string, ownerId: string) {
    const joinCode = this.generateJoinCode();

    const team = await this.server.prisma.team.create({
      data: {
        name,
        ownerId,
        joinCode,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            discordId: true,
            avatarHash: true,
          },
        },
        members: true,
        preferences: true,
      },
    });

    // Add owner as first team member
    await this.server.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: ownerId,
        isCoach: true,
      },
    });

    return team;
  }

  async joinTeam(joinCode: string, userId: string) {
    const team = await this.server.prisma.team.findUnique({
      where: { joinCode },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.members.length > 0) {
      throw new Error('Already a member of this team');
    }

    await this.server.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
      },
    });

    return this.getTeamById(team.id, userId);
  }

  async updateTeamPreferences(
    teamId: string,
    userId: string,
    preferences: {
      daysPerWeek: number;
      hoursPerWeek: number;
      minSlotMinutes?: number;
      maxSlotMinutes?: number;
    }
  ) {
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
          },
        },
      },
    });

    if (!membership || (!membership.isCoach && membership.team.ownerId !== userId)) {
      throw new Error('Only coaches and team owners can update preferences');
    }

    return this.server.prisma.teamPreference.upsert({
      where: { teamId },
      create: {
        teamId,
        ...preferences,
        minSlotMinutes: preferences.minSlotMinutes || 90,
        maxSlotMinutes: preferences.maxSlotMinutes || 180,
      },
      update: {
        ...preferences,
        ...(preferences.minSlotMinutes && { minSlotMinutes: preferences.minSlotMinutes }),
        ...(preferences.maxSlotMinutes && { maxSlotMinutes: preferences.maxSlotMinutes }),
      },
    });
  }

  private generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}