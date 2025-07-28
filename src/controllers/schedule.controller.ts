import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ScheduleService } from '../services/schedule.service';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor(private server: FastifyInstance) {
    this.scheduleService = new ScheduleService(server);
  }

  async getSchedule(
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

      const schedule = await this.scheduleService.getTeamSchedule(teamId, userId);
      
      reply.send({ schedule });
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

  async computeSchedule(
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

      const result = await this.scheduleService.computeSchedule(teamId, userId);
      
      reply.send(result);
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Only coaches') ? 403 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async getNextSlot(
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

      const nextSlot = await this.scheduleService.getNextTrainingSlot(teamId, userId);
      
      reply.send({ nextSlot });
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
}