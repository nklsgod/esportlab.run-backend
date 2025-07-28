import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';

export class AuthController {
  private authService: AuthService;

  constructor(private server: FastifyInstance) {
    this.authService = new AuthService(server);
  }

  async discordAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { codeVerifier, codeChallenge } = this.server.discord.generatePKCE();
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store codeVerifier and state temporarily (in a real app, use Redis or database)
      // For now, we'll encode them in the state parameter
      const encodedState = Buffer.from(JSON.stringify({ state, codeVerifier })).toString('base64url');
      
      const authUrl = this.server.discord.getAuthUrl(codeChallenge, encodedState);
      
      reply.redirect(authUrl);
    } catch (error) {
      this.server.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to initiate Discord authentication',
          statusCode: 500,
        },
      });
    }
  }

  async discordCallback(
    request: FastifyRequest<{
      Querystring: { code?: string; state?: string; error?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { code, state, error: oauthError } = request.query;

      if (oauthError) {
        throw new Error(`OAuth error: ${oauthError}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Decode state to get codeVerifier
      if (!state) {
        throw new Error('No state parameter received');
      }

      let codeVerifier: string;
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString());
        codeVerifier = decodedState.codeVerifier;
      } catch (error) {
        throw new Error('Invalid state parameter');
      }
      
      const tokenData = await this.server.discord.exchangeCodeForToken(
        code,
        codeVerifier
      );
      
      const discordUser = await this.server.discord.getUserInfo(
        tokenData.access_token
      );
      
      const user = await this.authService.findOrCreateUser(discordUser);

      const tokens = this.server.generateTokens(user.id);

      // Redirect to frontend with tokens in URL params for cross-domain authentication
      const frontendUrl = new URL('/auth/callback', env.FRONTEND_URL);
      frontendUrl.searchParams.set('access_token', tokens.accessToken);
      frontendUrl.searchParams.set('refresh_token', tokens.refreshToken);
      frontendUrl.searchParams.set('user', JSON.stringify({
        ...user,
        avatarUrl: this.authService.generateAvatarUrl(
          user.discordId,
          user.avatarHash
        ),
      }));

      reply.redirect(frontendUrl.toString());
    } catch (error) {
      this.server.log.error(error);
      
      // Redirect to frontend with error
      const frontendUrl = new URL('/auth/callback', env.FRONTEND_URL);
      frontendUrl.searchParams.set('error', 'Authentication failed');
      frontendUrl.searchParams.set('error_description', error.message || 'Unknown error');
      
      reply.redirect(frontendUrl.toString());
    }
  }

  async refresh(
    request: FastifyRequest<{
      Body: { refreshToken: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const decoded = this.server.jwt.verify(refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await this.authService.getUserById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const tokens = this.server.generateTokens(user.id);
      
      reply.send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      this.server.log.error(error);
      reply.status(401).send({
        error: {
          message: 'Invalid refresh token',
          statusCode: 401,
        },
      });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      reply.send({
        user: {
          ...user,
          avatarUrl: this.authService.generateAvatarUrl(
            user.discordId,
            user.avatarHash
          ),
        },
      });
    } catch (error) {
      this.server.log.error(error);
      reply.status(404).send({
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }
  }
}