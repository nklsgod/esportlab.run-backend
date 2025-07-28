# esportLab.run – Spezifikation & `task.md` (Backend Node.js + PostgreSQL auf Railway)

> **Scope dieses Dokuments**: _Nur Backend_. Frontend‑Aufgaben wurden entfernt, da die Repos getrennt werden sollen. Authentifizierung erfolgt ausschließlich via **Discord OAuth2**; das Discord‑Profilbild wird als User‑Avatar verwendet. Alle Endpunkte liefern im MVP noch Dummy‑Daten, bis die echte Implementierung folgt.

---

## 1 · Architektur & Tech‑Stack (Backend)

| Layer     | Technologie                              |
| --------- | ---------------------------------------- |
| Runtime   | **Node.js 20+**                          |
| Framework | **Fastify** (leicht & schnell)           |
| ORM       | **Prisma**                               |
| Auth      | **Discord OAuth2** (PKCE + Botless Flow) |
| DB        | **PostgreSQL** (Railway)                 |
| Tests     | Vitest/Jest                              |
| Build     | tsup / ESBuild                           |

> **Dummy‑Mode**: `USE_DUMMY_DATA=true` → Antworten aus `/dummy/*.json`.

---

## 2 · Domänenmodell

### Entitäten

- **User**: Discord‑Account in der App.
- **Team**: besitzt einen **Owner** (User) & **Join‑Code**.
- **TeamMember**: Zuordnung User ↔ Team (mit **Rolle** & `isCoach`).
- **Availability**: bevorzugte Zeitfenster.
- **Absence**: Fehlzeiten.
- **TeamPreference**: gewünschte Trainings‑Tage & ‑Stunden.
- **TrainingSlot**: vom Scheduler erzeugte Termine.
- **Task**: Aufgaben mit `scope`: `TEAM`, `COACH`, `ROLE`.

---

## 3 · Datenbank‑Schema (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  DUELLIST
  CONTROLLER
  SENTINEL
  INITIATOR
  FLEX
}

enum TaskScope {
  TEAM
  COACH
  ROLE
}

enum Weekday {
  MON
  TUE
  WED
  THU
  FRI
  SAT
  SUN
}

model User {
  id           String    @id @default(cuid())
  discordId    String    @unique
  username     String
  discriminator String?  // z. B. "0420" – kann entfallen seit Discord 2023
  avatarHash   String?   // zur Laufzeit in URL umgewandelt
  email        String?   @unique // wird von Discord nur mit `email`‑Scope geliefert
  createdAt    DateTime  @default(now())
  members      TeamMember[]
  availabilities Availability[]
  absences     Absence[]
}

model Team {
  id           String   @id @default(cuid())
  name         String
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])
  joinCode     String   @unique
  createdAt    DateTime @default(now())
  members      TeamMember[]
  preferences  TeamPreference?
  slots        TrainingSlot[]
  tasks        Task[]
}

model TeamMember {
  id        String  @id @default(cuid())
  teamId    String
  userId    String
  role      Role?
  isCoach   Boolean  @default(false)
  createdAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
}

model Availability {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  weekday   Weekday
  startTime Int      // Minuten seit 00:00
  endTime   Int
  priority  Int      @default(1)

  team Team @relation(fields: [teamId], references: [id])
  user User @relation(fields: [userId], references: [id])
}

model Absence {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  start     DateTime
  end       DateTime
  reason    String?

  team Team @relation(fields: [teamId], references: [id])
  user User @relation(fields: [userId], references: [id])
}

model TeamPreference {
  id              String  @id @default(cuid())
  teamId          String  @unique
  daysPerWeek     Int
  hoursPerWeek    Int
  minSlotMinutes  Int     @default(90)
  maxSlotMinutes  Int     @default(180)

  team Team @relation(fields: [teamId], references: [id])
}

model TrainingSlot {
  id        String   @id @default(cuid())
  teamId    String
  date      DateTime
  duration  Int
  players   Int
  createdAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id])
}

model Task {
  id          String    @id @default(cuid())
  teamId      String
  scope       TaskScope
  title       String
  description String?
  role        Role?
  isCoachOnly Boolean   @default(false)
  assigneeId  String?
  status      String    @default("open")
  dueAt       DateTime?
  createdAt   DateTime  @default(now())

  team        Team       @relation(fields: [teamId], references: [id])
  assignee    TeamMember? @relation(fields: [assigneeId], references: [id])
}
```

---

## 4 · Authentifizierungs‑Flow (Discord OAuth2)

1. **Client** ruft `GET /auth/discord` → 302 Redirect zu Discord‐authorize‑URL mit `client_id`, `redirect_uri`, `response_type=code`, `scope=identify email` (E‑Mail optional) und **PKCE**.
2. Benutzer akzeptiert.
3. Discord ruft `GET /auth/discord/callback?code=...&state=...` auf.
4. Backend tauscht `code` gegen Access‑Token (und optional Refresh‑Token) aus.
5. Mit Token wird `https://discord.com/api/users/@me` abgefragt ⇒ enthält `id`, `username`, `avatar`, `email?`.
6. **User‐Upsert**: Wenn `discordId` existiert → Login, sonst Create.
7. Backend erstellt **JWT** (Access + Refresh) und liefert {user, accessToken, refreshToken}.
8. Avatar‑URL wird clientseitig aus `https://cdn.discordapp.com/avatars/{discordId}/{avatarHash}.png?size=128` gebildet.

### Endpunkte

| Method | Path                     | Beschreibung                         |
| ------ | ------------------------ | ------------------------------------ |
| `GET`  | `/auth/discord`          | Redirect zu Discord                  |
| `GET`  | `/auth/discord/callback` | Exchange `code` → User + JWT         |
| `POST` | `/auth/refresh`          | Neues Access‑Token via Refresh‑Token |
| `GET`  | `/auth/me`               | Aktuellen User liefern               |

> **Dummy‑Modus**: `/auth/discord/callback` liest einen statischen User aus `dummy/user.json` und liefert Dummy‑Token.

---

## 5 · API‑Design (Kurzfassung der übrigen Routen)

Die restlichen Routen bleiben gegenüber der ersten Version unverändert, nur dass Auth‑Header jetzt obligatorisch ist und E‑Mail/PW‑Routen entfallen.

---

## 6 · Scheduler‑Heuristik & Rollen/Tasks

Unverändert – siehe frühere Spezifikation.

---

## 7 · Railway‑Setup (Backend‑Repo)

- **Service api**: Fastify‑App.

  - Start: `pnpm start` (oder `node dist/index.js`).
  - Health‐Endpoint: `/healthz`.

- **Service postgres**: automatisch.
- Env‑Vars siehe `.env.example` (unten).

---

## 8 · Verzeichnisstruktur (Backend‑Repo)

```
backend/
  src/
    index.ts            # Start
    server.ts           # Fastify Bootstrapping
    config/env.ts
    plugins/
      prisma.ts
      discord-oauth.ts
      auth.ts           # JWT Verify
    routes/
      auth.routes.ts
      teams.routes.ts
      availability.routes.ts
      absences.routes.ts
      schedule.routes.ts
      tasks.routes.ts
    controllers/
      auth.controller.ts
      teams.controller.ts
      ...
    services/
      auth.service.ts
      discord.service.ts # API Calls zu Discord
      ...
    dummy/              # JSON‑Dateien für Dummy‑Mode
  prisma/
    schema.prisma
    seed.ts
  test/
  package.json
  tsconfig.json
  .env.example
```

---

## 9 · `.env.example`

```
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/esportlab
JWT_SECRET=super-secret
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=30d
DISCORD_CLIENT_ID=your-id
DISCORD_CLIENT_SECRET=your-secret
DISCORD_REDIRECT_URI=https://api.esportlab.run/auth/discord/callback
USE_DUMMY_DATA=true
CORS_ORIGIN=http://localhost:5173
```

---

# `task.md` – Backend Tasks (ohne Frontend)

```markdown
# Tasks – esportLab.run Backend (Fastify + Prisma + Discord OAuth)

## 0. Projektsetup

- [ ] Neues Git‑Repository `esportlab-backend` anlegen.
- [ ] ESLint/Prettier/Vitest einrichten.
- [ ] CI – Lint + Test Workflow (GitHub Actions).

## 1. Infrastruktur

- [ ] Fastify‑Projekt initialisieren (TypeScript).
- [ ] Env‑Handling (`dotenv`, Zod‑Schema).
- [ ] Prisma init & Schema gemäß Spezifikation.
- [ ] Seed‑Skript (Dummy‑Daten) & Migrate.
- [ ] `USE_DUMMY_DATA` Toggle (JSON‑Layer).
- [ ] Discord‑OAuth‑Plugin (PKCE) – Redirect & Callback Handler.
- [ ] JWT‑Sign & Verify.
- [ ] Fehler‑Middleware (einheitliches Format).

## 2. Routen – Dummy‑Implementierung

- [ ] `GET /auth/discord` – Redirect.
- [ ] `GET /auth/discord/callback` – Dummy‑Login.
- [ ] `POST /auth/refresh` – Dummy Token.
- [ ] `GET /auth/me` – Dummy User.
- [ ] `POST /teams` – Dummy Team + Join‑Code.
- [ ] `POST /teams/join` – Join per Code (Dummy).
- [ ] `GET /teams` – Eigene Teams.
- [ ] `GET /teams/:teamId` – Details.
- [ ] `PATCH /teams/:teamId/preferences` – upsert Dummy Präferenzen.
- [ ] `GET /teams/:teamId/availability`
- [ ] `POST /teams/:teamId/availability`
- [ ] `DELETE /teams/:teamId/availability/:id`
- [ ] `GET /teams/:teamId/absences`
- [ ] `POST /teams/:teamId/absences`
- [ ] `DELETE /teams/:teamId/absences/:id`
- [ ] `POST /teams/:teamId/schedule/compute` – Beispiel‑Slots.
- [ ] `GET /teams/:teamId/schedule/next`
- [ ] `GET /teams/:teamId/tasks`
- [ ] `POST /teams/:teamId/tasks`
- [ ] `PATCH /teams/:teamId/tasks/:id`
- [ ] `DELETE /teams/:teamId/tasks/:id`
- [ ] `GET /roles` – Enum.
- [ ] `GET /teams/:teamId/summary` – Kennzahlen.

## 3. Scheduler (optional echte Heuristik)

- [ ] Utilities: Zeitfenster‑Merge, Overlap‑Berechnung.
- [ ] Slot‑Auswahl unter Constraints.

## 4. Tests

- [ ] Unit‑Tests für Utils.
- [ ] API‑Tests im Dummy‑Mode (Fastify `inject`).

## 5. Deployment

- [ ] Railway Service einrichten.
- [ ] Build Script & Start Command.
- [ ] `prisma migrate deploy` bei `USE_DUMMY_DATA=false`.
```
