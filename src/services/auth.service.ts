import { FastifyInstance } from 'fastify';

export class AuthService {
  constructor(private server: FastifyInstance) {}

  async findOrCreateUser(discordUser: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
  }) {
    // Try to find existing user
    let user = await this.server.prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (!user) {
      // Create new user
      user = await this.server.prisma.user.create({
        data: {
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatarHash: discordUser.avatar,
          email: discordUser.email,
        },
      });
    } else {
      // Update existing user with latest Discord info
      user = await this.server.prisma.user.update({
        where: { id: user.id },
        data: {
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatarHash: discordUser.avatar,
          email: discordUser.email,
        },
      });
    }

    return user;
  }

  async getUserById(id: string) {
    return this.server.prisma.user.findUnique({
      where: { id },
    });
  }

  generateAvatarUrl(discordId: string, avatarHash: string | null): string | null {
    if (!avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128`;
  }
}