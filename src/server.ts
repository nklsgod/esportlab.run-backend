import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';

// Plugins
import prismaPlugin from './plugins/prisma';
import discordOAuthPlugin from './plugins/discord-oauth';
import authPlugin from './plugins/auth';

// Routes
import authRoutes from './routes/auth.routes';
import teamsRoutes from './routes/teams.routes';
import availabilityRoutes from './routes/availability.routes';
import scheduleRoutes from './routes/schedule.routes';
import tasksRoutes from './routes/tasks.routes';
import rolesRoutes from './routes/roles.routes';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // CORS plugin
  await server.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Register plugins
  await server.register(prismaPlugin);
  await server.register(discordOAuthPlugin);
  await server.register(authPlugin);

  // Register routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(teamsRoutes, { prefix: '/teams' });
  await server.register(availabilityRoutes, { prefix: '/teams' });
  await server.register(scheduleRoutes, { prefix: '/teams' });
  await server.register(tasksRoutes, { prefix: '/teams' });
  await server.register(rolesRoutes);

  // Health check endpoint
  server.get('/healthz', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Error handler
  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    
    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        ...(env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  });

  // Not found handler
  server.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
      },
    });
  });

  return server;
}