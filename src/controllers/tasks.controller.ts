import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TasksService } from '../services/tasks.service';
import { TaskScope, Role } from '@prisma/client';

export class TasksController {
  private tasksService: TasksService;

  constructor(private server: FastifyInstance) {
    this.tasksService = new TasksService(server);
  }

  async getTasks(
    request: FastifyRequest<{
      Params: { teamId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const tasks = await this.tasksService.getTeamTasks(teamId, userId);
      
      reply.send({ tasks });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Access denied') ? 403 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async createTask(
    request: FastifyRequest<{
      Params: { teamId: string };
      Body: {
        scope: TaskScope;
        title: string;
        description?: string;
        role?: Role;
        isCoachOnly?: boolean;
        assigneeId?: string;
        dueAt?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const taskData = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!taskData.scope || !taskData.title) {
        reply.status(400).send({
          error: {
            message: 'scope and title are required',
            statusCode: 400,
          },
        });
        return;
      }

      const task = await this.tasksService.createTask(teamId, userId, {
        ...taskData,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
      });
      
      reply.status(201).send({ task });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Only coaches') ? 403 : 
                        error.message.includes('required') ? 400 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async updateTask(
    request: FastifyRequest<{
      Params: { teamId: string; id: string };
      Body: {
        title?: string;
        description?: string;
        status?: string;
        assigneeId?: string;
        dueAt?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { id } = request.params;
      const taskData = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const task = await this.tasksService.updateTask(id, userId, {
        ...taskData,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
      });
      
      reply.send({ task });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Access denied') ? 403 :
                        error.message.includes('not found') ? 404 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async deleteTask(
    request: FastifyRequest<{
      Params: { teamId: string; id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { id } = request.params;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await this.tasksService.deleteTask(id, userId);
      
      reply.status(204).send();
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Only coaches') ? 403 :
                        error.message.includes('not found') ? 404 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }
}