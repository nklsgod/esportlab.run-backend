import { FastifyPluginAsync } from 'fastify';
import { Role } from '@prisma/client';

const rolesRoutes: FastifyPluginAsync = async (server) => {
  // Get available roles
  server.get('/roles', {
    schema: {
      description: 'Get available player roles',
      tags: ['roles'],
      response: {
        200: {
          type: 'object',
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const roles = [
      {
        value: Role.DUELLIST,
        label: 'Duelist',
        description: 'Entry fraggers who take map control',
      },
      {
        value: Role.CONTROLLER,
        label: 'Controller',
        description: 'Support players who use smokes and utility',
      },
      {
        value: Role.SENTINEL,
        label: 'Sentinel',
        description: 'Defensive anchors who watch flanks',
      },
      {
        value: Role.INITIATOR,
        label: 'Initiator',
        description: 'Information gatherers who create opportunities',
      },
      {
        value: Role.FLEX,
        label: 'Flex',
        description: 'Versatile players who can fill multiple roles',
      },
    ];

    reply.send({ roles });
  });
};

export default rolesRoutes;