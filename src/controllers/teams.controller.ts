import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TeamsService } from '../services/teams.service';

export class TeamsController {
  private teamsService: TeamsService;

  constructor(private server: FastifyInstance) {
    this.teamsService = new TeamsService(server);
  }

  async getTeams(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const teams = await this.teamsService.getUserTeams(userId);
      
      reply.send({ teams });
    } catch (error) {
      this.server.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to fetch teams',
          statusCode: 500,
        },
      });
    }
  }

  async getTeam(
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

      const team = await this.teamsService.getTeamById(teamId, userId);
      
      if (!team) {
        reply.status(404).send({
          error: {
            message: 'Team not found or access denied',
            statusCode: 404,
          },
        });
        return;
      }

      reply.send({ team });
    } catch (error) {
      this.server.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to fetch team',
          statusCode: 500,
        },
      });
    }
  }

  async createTeam(
    request: FastifyRequest<{
      Body: { name: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { name } = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!name || name.trim().length === 0) {
        reply.status(400).send({
          error: {
            message: 'Team name is required',
            statusCode: 400,
          },
        });
        return;
      }

      const team = await this.teamsService.createTeam(name.trim(), userId);
      
      reply.status(201).send({ team });
    } catch (error) {
      this.server.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to create team',
          statusCode: 500,
        },
      });
    }
  }

  async joinTeam(
    request: FastifyRequest<{
      Body: { joinCode: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { joinCode } = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!joinCode || joinCode.trim().length === 0) {
        reply.status(400).send({
          error: {
            message: 'Join code is required',
            statusCode: 400,
          },
        });
        return;
      }

      const team = await this.teamsService.joinTeam(joinCode.trim().toUpperCase(), userId);
      
      reply.send({ team });
    } catch (error) {
      this.server.log.error(error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Already a member') ? 409 : 500;
      
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    }
  }

  async updatePreferences(
    request: FastifyRequest<{
      Params: { teamId: string };
      Body: {
        daysPerWeek: number;
        hoursPerWeek: number;
        minSlotMinutes?: number;
        maxSlotMinutes?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      const { teamId } = request.params;
      const preferences = request.body;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate preferences
      if (!preferences.daysPerWeek || !preferences.hoursPerWeek) {
        reply.status(400).send({
          error: {
            message: 'daysPerWeek and hoursPerWeek are required',
            statusCode: 400,
          },
        });
        return;
      }

      if (preferences.daysPerWeek < 1 || preferences.daysPerWeek > 7) {
        reply.status(400).send({
          error: {
            message: 'daysPerWeek must be between 1 and 7',
            statusCode: 400,
          },
        });
        return;
      }

      if (preferences.hoursPerWeek < 1) {
        reply.status(400).send({
          error: {
            message: 'hoursPerWeek must be at least 1',
            statusCode: 400,
          },
        });
        return;
      }

      const updatedPreferences = await this.teamsService.updateTeamPreferences(
        teamId,
        userId,
        preferences
      );
      
      reply.send({ preferences: updatedPreferences });
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
}