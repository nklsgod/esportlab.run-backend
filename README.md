# esportLab.run Backend

Backend API for esportLab.run - A team management and scheduling platform for esports teams.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Discord OAuth2 with JWT
- **Deployment**: Railway

## Features

- **Authentication**: Discord OAuth2 with PKCE flow
- **Team Management**: Create teams, join with codes, role assignments
- **Availability Tracking**: Set time preferences and availability
- **Absence Management**: Track team member absences
- **Task System**: Assign and track team tasks
- **Schedule Optimization**: Compute optimal training schedules
- **Role-based Permissions**: Coach and owner privileges

## API Endpoints

### Authentication
- `GET /auth/discord` - Initiate Discord OAuth
- `GET /auth/discord/callback` - OAuth callback (redirects to frontend)
- `POST /auth/refresh` - Refresh JWT tokens
- `GET /auth/me` - Get current user

### Teams
- `GET /teams` - Get user's teams
- `POST /teams` - Create new team
- `POST /teams/join` - Join team with code
- `GET /teams/:id` - Get team details
- `PATCH /teams/:id/preferences` - Update team preferences

### Availability & Absences
- `GET /:teamId/availability` - Get team availability
- `POST /:teamId/availability` - Add availability
- `DELETE /:teamId/availability/:id` - Remove availability
- `GET /:teamId/absences` - Get team absences
- `POST /:teamId/absences` - Add absence
- `DELETE /:teamId/absences/:id` - Remove absence

### Schedule & Tasks
- `GET /:teamId/schedule` - Get training schedule
- `POST /:teamId/schedule/compute` - Compute optimal schedule
- `GET /:teamId/schedule/next` - Get next training slot
- `GET /:teamId/tasks` - Get team tasks
- `POST /:teamId/tasks` - Create task
- `PATCH /:teamId/tasks/:id` - Update task
- `DELETE /:teamId/tasks/:id` - Delete task

### Utilities
- `GET /roles` - Get available player roles
- `GET /healthz` - Health check

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Set up database**:
   ```bash
   # Start PostgreSQL locally
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Railway Deployment

### 1. Set up Railway Project

1. Create new Railway project
2. Add PostgreSQL database service
3. Deploy from GitHub repository

### 2. Environment Variables

Set these in Railway dashboard:

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=${{secrets.JWT_SECRET}}
DISCORD_CLIENT_ID=${{secrets.DISCORD_CLIENT_ID}}
DISCORD_CLIENT_SECRET=${{secrets.DISCORD_CLIENT_SECRET}}
DISCORD_REDIRECT_URI=https://your-railway-app.up.railway.app/auth/discord/callback
CORS_ORIGIN=https://esportlab.run
FRONTEND_URL=https://esportlab.run
```

### 3. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Add OAuth2 redirect URI: `https://your-railway-app.up.railway.app/auth/discord/callback`
4. Copy Client ID and Secret to Railway secrets

### 4. Deploy

The deployment will automatically:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Start the server

## Database Schema

The application uses the following entities:

- **User**: Discord account information
- **Team**: Team with owner and join code
- **TeamMember**: User-team relationship with roles
- **Availability**: Time preferences by weekday
- **Absence**: Scheduled absences
- **TeamPreference**: Training preferences
- **TrainingSlot**: Scheduled training sessions
- **Task**: Team tasks with assignments

## Authentication Flow

1. Frontend calls `/auth/discord`
2. User authorizes with Discord
3. Backend receives callback and creates/updates user
4. Backend redirects to frontend with JWT tokens as URL parameters
5. Frontend stores tokens for API calls

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```