import { FastifyPluginAsync } from 'fastify';
import { ScheduleController } from '../controllers/schedule.controller';

const scheduleRoutes: FastifyPluginAsync = async (server) => {
  const scheduleController = new ScheduleController(server);

  // All schedule routes require authentication
  server.addHook('preHandler', server.authenticate);

  // Get team schedule
  server.get('/:teamId/schedule', {
    schema: {
      description: 'Get team training schedule',
      tags: ['schedule'],
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
            schedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  teamId: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  duration: { type: 'number' },
                  players: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, scheduleController.getSchedule.bind(scheduleController));

  // Compute optimal schedule
  server.post('/:teamId/schedule/compute', {
    schema: {
      description: 'Compute optimal training schedule (coaches and owners only)',
      tags: ['schedule'],
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
            slots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  duration: { type: 'number' },
                  players: { type: 'number' },
                  feasibility: { type: 'number' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, scheduleController.computeSchedule.bind(scheduleController));

  // Get next training slot
  server.get('/:teamId/schedule/next', {
    schema: {
      description: 'Get next scheduled training slot',
      tags: ['schedule'],
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
            nextSlot: {
              type: ['object', 'null'],
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                date: { type: 'string', format: 'date-time' },
                duration: { type: 'number' },
                players: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, scheduleController.getNextSlot.bind(scheduleController));
};

export default scheduleRoutes;