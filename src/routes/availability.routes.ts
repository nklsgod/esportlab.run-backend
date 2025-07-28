import { FastifyPluginAsync } from 'fastify';
import { AvailabilityController } from '../controllers/availability.controller';

const availabilityRoutes: FastifyPluginAsync = async (server) => {
  const availabilityController = new AvailabilityController(server);

  // All availability routes require authentication
  server.addHook('preHandler', server.authenticate);

  // Get team availability
  server.get('/:teamId/availability', {
    schema: {
      description: 'Get team availability',
      tags: ['availability'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            availability: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  teamId: { type: 'string' },
                  userId: { type: 'string' },
                  weekday: { type: 'string' },
                  startTime: { type: 'number' },
                  endTime: { type: 'number' },
                  priority: { type: 'number' },
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
          },
        },
      },
    },
  }, availabilityController.getAvailability.bind(availabilityController));

  // Create availability
  server.post('/:teamId/availability', {
    schema: {
      description: 'Create availability for the authenticated user',
      tags: ['availability'],
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
        required: ['weekday', 'startTime', 'endTime'],
        properties: {
          weekday: { 
            type: 'string', 
            enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] 
          },
          startTime: { type: 'number', minimum: 0, maximum: 1440 },
          endTime: { type: 'number', minimum: 0, maximum: 1440 },
          priority: { type: 'number', minimum: 1, maximum: 10 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            availability: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                userId: { type: 'string' },
                weekday: { type: 'string' },
                startTime: { type: 'number' },
                endTime: { type: 'number' },
                priority: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, availabilityController.createAvailability.bind(availabilityController));

  // Delete availability
  server.delete('/:teamId/availability/:id', {
    schema: {
      description: 'Delete availability (only own availability)',
      tags: ['availability'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId', 'id'],
        properties: {
          teamId: { type: 'string' },
          id: { type: 'string' },
        },
      },
      response: {
        204: {
          type: 'null',
        },
      },
    },
  }, availabilityController.deleteAvailability.bind(availabilityController));

  // Get team absences
  server.get('/:teamId/absences', {
    schema: {
      description: 'Get team absences',
      tags: ['absences'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            absences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  teamId: { type: 'string' },
                  userId: { type: 'string' },
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                  reason: { type: ['string', 'null'] },
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
          },
        },
      },
    },
  }, availabilityController.getAbsences.bind(availabilityController));

  // Create absence
  server.post('/:teamId/absences', {
    schema: {
      description: 'Create absence for the authenticated user',
      tags: ['absences'],
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
        required: ['start', 'end'],
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          reason: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            absence: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                userId: { type: 'string' },
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' },
                reason: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  }, availabilityController.createAbsence.bind(availabilityController));

  // Delete absence
  server.delete('/:teamId/absences/:id', {
    schema: {
      description: 'Delete absence (only own absence)',
      tags: ['absences'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId', 'id'],
        properties: {
          teamId: { type: 'string' },
          id: { type: 'string' },
        },
      },
      response: {
        204: {
          type: 'null',
        },
      },
    },
  }, availabilityController.deleteAbsence.bind(availabilityController));
};

export default availabilityRoutes;