import { FastifyInstance } from 'fastify';
import { Weekday } from '@prisma/client';

export class AvailabilityService {
  constructor(private server: FastifyInstance) {}

  async getTeamAvailability(teamId: string, userId: string) {
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

    return this.server.prisma.availability.findMany({
      where: { teamId },
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
      orderBy: [
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getUserAvailability(teamId: string, userId: string) {
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

    return this.server.prisma.availability.findMany({
      where: {
        teamId,
        userId,
      },
      orderBy: [
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async createAvailability(
    teamId: string,
    userId: string,
    data: {
      weekday: Weekday;
      startTime: number;
      endTime: number;
      priority?: number;
    }
  ) {
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

    // Validate time range
    if (data.startTime >= data.endTime) {
      throw new Error('Start time must be before end time');
    }

    if (data.startTime < 0 || data.endTime > 24 * 60) {
      throw new Error('Invalid time range');
    }

    return this.server.prisma.availability.create({
      data: {
        teamId,
        userId,
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
        priority: data.priority || 1,
      },
    });
  }

  async deleteAvailability(availabilityId: string, userId: string) {
    const availability = await this.server.prisma.availability.findUnique({
      where: { id: availabilityId },
    });

    if (!availability) {
      throw new Error('Availability not found');
    }

    if (availability.userId !== userId) {
      throw new Error('Access denied');
    }

    await this.server.prisma.availability.delete({
      where: { id: availabilityId },
    });

    return { success: true };
  }

  async getTeamAbsences(teamId: string, userId: string) {
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

    return this.server.prisma.absence.findMany({
      where: { teamId },
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
      orderBy: { start: 'asc' },
    });
  }

  async getUserAbsences(teamId: string, userId: string) {
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

    return this.server.prisma.absence.findMany({
      where: {
        teamId,
        userId,
      },
      orderBy: { start: 'asc' },
    });
  }

  async createAbsence(
    teamId: string,
    userId: string,
    data: {
      start: Date;
      end: Date;
      reason?: string;
    }
  ) {
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

    // Validate date range
    if (data.start >= data.end) {
      throw new Error('Start date must be before end date');
    }

    return this.server.prisma.absence.create({
      data: {
        teamId,
        userId,
        start: data.start,
        end: data.end,
        reason: data.reason,
      },
    });
  }

  async deleteAbsence(absenceId: string, userId: string) {
    const absence = await this.server.prisma.absence.findUnique({
      where: { id: absenceId },
    });

    if (!absence) {
      throw new Error('Absence not found');
    }

    if (absence.userId !== userId) {
      throw new Error('Access denied');
    }

    await this.server.prisma.absence.delete({
      where: { id: absenceId },
    });

    return { success: true };
  }
}