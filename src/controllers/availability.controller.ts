import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AvailabilityService } from '../services/availability.service';
import { Weekday } from '@prisma/client';

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor(private server: FastifyInstance) {
    this.availabilityService = new AvailabilityService(server);
  }

  async getAvailability(
    request: FastifyRequest<{
      Params: { teamId: string };
      Querystring: { userId?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const { userId: queryUserId } = request.query;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let availability;
      if (queryUserId) {
        // Get specific user's availability (only if requesting own or team member)
        if (queryUserId !== userId) {
          // Could add additional permission check here for coaches/owners
          availability = await this.availabilityService.getUserAvailability(teamId, queryUserId);
        } else {
          availability = await this.availabilityService.getUserAvailability(teamId, userId);
        }
      } else {
        // Get all team availability
        availability = await this.availabilityService.getTeamAvailability(teamId, userId);
      }
      
      reply.send({ availability });
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

  async createAvailability(
    request: FastifyRequest<{
      Params: { teamId: string };
      Body: {
        weekday: Weekday;
        startTime: number;
        endTime: number;
        priority?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const availabilityData = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!availabilityData.weekday || 
          availabilityData.startTime === undefined || 
          availabilityData.endTime === undefined) {
        reply.status(400).send({
          error: {
            message: 'weekday, startTime, and endTime are required',
            statusCode: 400,
          },
        });
        return;
      }

      const availability = await this.availabilityService.createAvailability(
        teamId,
        userId,
        availabilityData
      );
      
      reply.status(201).send({ availability });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Access denied') ? 403 :
                        error.message.includes('Invalid') ? 400 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async deleteAvailability(
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

      await this.availabilityService.deleteAvailability(id, userId);
      
      reply.status(204).send();
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

  async getAbsences(
    request: FastifyRequest<{
      Params: { teamId: string };
      Querystring: { userId?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const { userId: queryUserId } = request.query;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let absences;
      if (queryUserId) {
        // Get specific user's absences (only if requesting own or team member)
        if (queryUserId !== userId) {
          // Could add additional permission check here for coaches/owners
          absences = await this.availabilityService.getUserAbsences(teamId, queryUserId);
        } else {
          absences = await this.availabilityService.getUserAbsences(teamId, userId);
        }
      } else {
        // Get all team absences
        absences = await this.availabilityService.getTeamAbsences(teamId, userId);
      }
      
      reply.send({ absences });
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

  async createAbsence(
    request: FastifyRequest<{
      Params: { teamId: string };
      Body: {
        start: string;
        end: string;
        reason?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const absenceData = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!absenceData.start || !absenceData.end) {
        reply.status(400).send({
          error: {
            message: 'start and end dates are required',
            statusCode: 400,
          },
        });
        return;
      }

      // Parse dates
      const start = new Date(absenceData.start);
      const end = new Date(absenceData.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        reply.status(400).send({
          error: {
            message: 'Invalid date format',
            statusCode: 400,
          },
        });
        return;
      }

      const absence = await this.availabilityService.createAbsence(
        teamId,
        userId,
        {
          start,
          end,
          reason: absenceData.reason,
        }
      );
      
      reply.status(201).send({ absence });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('Access denied') ? 403 :
                        error.message.includes('Start date') ? 400 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async deleteAbsence(
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

      await this.availabilityService.deleteAbsence(id, userId);
      
      reply.status(204).send();
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
}