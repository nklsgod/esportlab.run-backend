import { FastifyInstance } from 'fastify';
import { TaskScope, Role } from '@prisma/client';

export class TasksService {
  constructor(private server: FastifyInstance) {}

  async getTeamTasks(teamId: string, userId: string) {
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

    return this.server.prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(
    teamId: string,
    userId: string,
    data: {
      scope: TaskScope;
      title: string;
      description?: string;
      role?: Role;
      isCoachOnly?: boolean;
      assigneeId?: string;
      dueAt?: Date;
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
      throw new Error('Only coaches and team owners can create tasks');
    }

    return this.server.prisma.task.create({
      data: {
        teamId,
        scope: data.scope,
        title: data.title,
        description: data.description,
        role: data.role,
        isCoachOnly: data.isCoachOnly || false,
        assigneeId: data.assigneeId,
        dueAt: data.dueAt,
      },
      include: {
        assignee: {
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
      },
    });
  }

  async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      assigneeId?: string;
      dueAt?: Date;
    }
  ) {
    // Get task to check permissions
    const task = await this.server.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user is team member
    const membership = await this.server.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.teamId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    // Only coaches, owners, or assignees can update tasks
    const canUpdate = membership.isCoach || 
                     task.team.ownerId === userId || 
                     task.assigneeId === membership.id;

    if (!canUpdate) {
      throw new Error('Only coaches, owners, or assignees can update tasks');
    }

    return this.server.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: {
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
      },
    });
  }

  async deleteTask(taskId: string, userId: string) {
    // Get task to check permissions
    const task = await this.server.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user is coach or owner
    const membership = await this.server.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.teamId,
          userId,
        },
      },
    });

    if (!membership || (!membership.isCoach && task.team.ownerId !== userId)) {
      throw new Error('Only coaches and team owners can delete tasks');
    }

    await this.server.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }
}