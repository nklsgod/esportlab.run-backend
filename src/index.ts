import { buildServer } from './server';
import { env } from './config/env';

async function start() {
  try {
    const server = await buildServer();
    
    await server.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    server.log.info(`Server listening on port ${env.PORT}`);
    server.log.info(`Environment: ${env.NODE_ENV}`);
    server.log.info(`Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();