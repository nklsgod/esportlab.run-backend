import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'crypto';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    discord: {
      generatePKCE: () => { codeVerifier: string; codeChallenge: string };
      getAuthUrl: (codeChallenge: string, state?: string) => string;
      exchangeCodeForToken: (code: string, codeVerifier: string) => Promise<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      }>;
      getUserInfo: (accessToken: string) => Promise<{
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        email?: string;
      }>;
    };
  }
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

const discordOAuthPlugin: FastifyPluginAsync = async (server) => {
  const DISCORD_API_BASE = 'https://discord.com/api/v10';

  function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }

  function getAuthUrl(codeChallenge: string, state?: string) {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...(state && { state }),
    });

    return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
  }

  async function exchangeCodeForToken(code: string, codeVerifier: string) {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const data: DiscordTokenResponse = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  }

  async function getUserInfo(accessToken: string) {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const user: DiscordUser = await response.json();
    return user;
  }

  server.decorate('discord', {
    generatePKCE,
    getAuthUrl,
    exchangeCodeForToken,
    getUserInfo,
  });
};

export default fp(discordOAuthPlugin);