import { FastifyPluginAsync } from 'fastify';
import { AuthController } from '../controllers/auth.controller';

const authRoutes: FastifyPluginAsync = async (server) => {
  const authController = new AuthController(server);

  // Discord OAuth2 routes
  server.get('/discord', {
    schema: {
      description: 'Initiate Discord OAuth2 authentication',
      tags: ['auth'],
      response: {
        302: {
          type: 'null',
          description: 'Redirect to Discord authorization',
        },
      },
    },
  }, authController.discordAuth.bind(authController));

  server.get('/discord/callback', {
    schema: {
      description: 'Handle Discord OAuth2 callback',
      tags: ['auth'],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          state: { type: 'string' },
          error: { type: 'string' },
        },
      },
      response: {
        302: {
          type: 'null',
          description: 'Redirect to frontend with authentication tokens',
        },
      },
    },
  }, authController.discordCallback.bind(authController));

  // Token refresh
  server.post('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, authController.refresh.bind(authController));

  // Get current user
  server.get('/me', {
    preHandler: [server.authenticate],
    schema: {
      description: 'Get current authenticated user',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                discordId: { type: 'string' },
                username: { type: 'string' },
                discriminator: { type: ['string', 'null'] },
                avatarHash: { type: ['string', 'null'] },
                avatarUrl: { type: ['string', 'null'] },
                email: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, authController.me.bind(authController));
};

export default authRoutes;