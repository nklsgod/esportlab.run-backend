import { FastifyPluginAsync } from 'fastify';
import { TeamsController } from '../controllers/teams.controller';

const teamsRoutes: FastifyPluginAsync = async (server) => {
  const teamsController = new TeamsController(server);

  // All team routes require authentication
  server.addHook('preHandler', server.authenticate);

  // Get user's teams
  server.get('/', {
    schema: {
      description: 'Get all teams for the authenticated user',
      tags: ['teams'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            teams: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  ownerId: { type: 'string' },
                  joinCode: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, teamsController.getTeams.bind(teamsController));

  // Get specific team
  server.get('/:teamId', {
    schema: {
      description: 'Get team details',
      tags: ['teams'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            team: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                ownerId: { type: 'string' },
                joinCode: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                owner: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    discordId: { type: 'string' },
                    avatarHash: { type: ['string', 'null'] },
                  },
                },
                members: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      role: { type: ['string', 'null'] },
                      isCoach: { type: 'boolean' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' },
                          discordId: { type: 'string' },
                          avatarHash: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                },
                preferences: {
                  type: ['object', 'null'],
                  properties: {
                    id: { type: 'string' },
                    daysPerWeek: { type: 'number' },
                    hoursPerWeek: { type: 'number' },
                    minSlotMinutes: { type: 'number' },
                    maxSlotMinutes: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, teamsController.getTeam.bind(teamsController));

  // Create team
  server.post('/', {
    schema: {
      description: 'Create a new team',
      tags: ['teams'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            team: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                ownerId: { type: 'string' },
                joinCode: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, teamsController.createTeam.bind(teamsController));

  // Join team
  server.post('/join', {
    schema: {
      description: 'Join a team using join code',
      tags: ['teams'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['joinCode'],
        properties: {
          joinCode: { type: 'string', minLength: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            team: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                ownerId: { type: 'string' },
                joinCode: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, teamsController.joinTeam.bind(teamsController));

  // Update team preferences
  server.patch('/:teamId/preferences', {
    schema: {
      description: 'Update team training preferences (coaches and owners only)',
      tags: ['teams'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['daysPerWeek', 'hoursPerWeek'],
        properties: {
          daysPerWeek: { type: 'number', minimum: 1, maximum: 7 },
          hoursPerWeek: { type: 'number', minimum: 1 },
          minSlotMinutes: { type: 'number', minimum: 30 },
          maxSlotMinutes: { type: 'number', minimum: 30 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            preferences: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                daysPerWeek: { type: 'number' },
                hoursPerWeek: { type: 'number' },
                minSlotMinutes: { type: 'number' },
                maxSlotMinutes: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, teamsController.updatePreferences.bind(teamsController));
};

export default teamsRoutes;