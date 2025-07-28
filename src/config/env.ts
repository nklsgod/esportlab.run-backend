import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8080'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_IN: z.string().default('30d'),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  DISCORD_REDIRECT_URI: z.string(),
  CORS_ORIGIN: z.string().default('https://esportlab.run'),
  FRONTEND_URL: z.string().default('https://esportlab.run'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;