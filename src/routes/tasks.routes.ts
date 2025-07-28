import { FastifyPluginAsync } from 'fastify';
import { TasksController } from '../controllers/tasks.controller';

const tasksRoutes: FastifyPluginAsync = async (server) => {
  const tasksController = new TasksController(server);

  // All task routes require authentication
  server.addHook('preHandler', server.authenticate);

  // Get team tasks
  server.get('/:teamId/tasks', {
    schema: {
      description: 'Get team tasks',
      tags: ['tasks'],
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
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  teamId: { type: 'string' },
                  scope: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  role: { type: ['string', 'null'] },
                  isCoachOnly: { type: 'boolean' },
                  assigneeId: { type: ['string', 'null'] },
                  status: { type: 'string' },
                  dueAt: { type: ['string', 'null'], format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' },
                  assignee: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string' },
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
      },
    },
  }, tasksController.getTasks.bind(tasksController));

  // Create task
  server.post('/:teamId/tasks', {
    schema: {
      description: 'Create a new task (coaches and owners only)',
      tags: ['tasks'],
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
        required: ['scope', 'title'],
        properties: {
          scope: { 
            type: 'string', 
            enum: ['TEAM', 'COACH', 'ROLE'] 
          },
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          role: { 
            type: 'string', 
            enum: ['DUELLIST', 'CONTROLLER', 'SENTINEL', 'INITIATOR', 'FLEX'] 
          },
          isCoachOnly: { type: 'boolean' },
          assigneeId: { type: 'string' },
          dueAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            task: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                scope: { type: 'string' },
                title: { type: 'string' },
                description: { type: ['string', 'null'] },
                role: { type: ['string', 'null'] },
                isCoachOnly: { type: 'boolean' },
                assigneeId: { type: ['string', 'null'] },
                status: { type: 'string' },
                dueAt: { type: ['string', 'null'], format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, tasksController.createTask.bind(tasksController));

  // Update task
  server.patch('/:teamId/tasks/:id', {
    schema: {
      description: 'Update a task (coaches, owners, or assignees only)',
      tags: ['tasks'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId', 'id'],
        properties: {
          teamId: { type: 'string' },
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          status: { type: 'string' },
          assigneeId: { type: 'string' },
          dueAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            task: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                scope: { type: 'string' },
                title: { type: 'string' },
                description: { type: ['string', 'null'] },
                role: { type: ['string', 'null'] },
                isCoachOnly: { type: 'boolean' },
                assigneeId: { type: ['string', 'null'] },
                status: { type: 'string' },
                dueAt: { type: ['string', 'null'], format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, tasksController.updateTask.bind(tasksController));

  // Delete task
  server.delete('/:teamId/tasks/:id', {
    schema: {
      description: 'Delete a task (coaches and owners only)',
      tags: ['tasks'],
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
  }, tasksController.deleteTask.bind(tasksController));
};

export default tasksRoutes;