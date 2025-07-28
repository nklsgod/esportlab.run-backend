import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateTokens: (userId: string) => {
      accessToken: string;
      refreshToken: string;
    };
  }
  
  interface FastifyRequest {
    user?: {
      id: string;
      iat: number;
      exp: number;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (server) => {
  // Register JWT plugin
  await server.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
    verify: {
      extractToken: (request) => {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.substring(7);
        }
        return null;
      },
    },
  });

  // Authentication decorator
  server.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        error: {
          message: 'Unauthorized',
          statusCode: 401,
        },
      });
    }
  });

  // Token generation helper
  server.decorate('generateTokens', function (userId: string) {
    const accessToken = server.jwt.sign({ id: userId });
    const refreshToken = server.jwt.sign(
      { id: userId, type: 'refresh' },
      { expiresIn: env.REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  });
};

export default fp(authPlugin);