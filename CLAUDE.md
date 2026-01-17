# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BF2 Matchmaking (https://bf2.top/) - A Battlefield 2 matchmaking platform with Discord/TeamSpeak integration, server management, and player tracking.

## Build and Development Commands

```bash
# Install dependencies (uses npm workspaces)
npm install

# Build all packages and apps
npm run build

# Run all apps in development mode
npm run dev

# Type-check all packages and apps
npm run verify

# Generate Supabase types (requires supabase CLI)
npm run generate-types

# Generate Zod schemas from Supabase types
npm run generate-schemas

# Run individual app in development mode
npm run dev -w web      # Next.js web app on port 5005
npm run dev -w api      # Koa API server on port 5004
npm run dev -w engine   # Discord/scheduler engine on port 5006
```

## Architecture

Turborepo monorepo with three layers:

### Apps (`apps/`)
- **web**: Next.js 15 with App Router, React 19, TailwindCSS 4, daisyUI. User-facing web app for matches, teams, stats, and server management.
- **api**: Koa server exposing REST endpoints for platform operations, server management, webhooks, matches, and player data. Uses esbuild for production builds.
- **engine**: Background service hosting Discord bot, scheduling jobs (match lifecycle, server resets), and TeamSpeak integration. Listens to Discord events and manages match automation.

### Shared Packages (`packages/`)
All packages use TypeScript source directly (no pre-compilation) with subpath exports.

- **@bf2-matchmaking/types**: TypeScript type definitions with subpath exports for api, engine, platform, rcon, redis, server, and supabase types
- **@bf2-matchmaking/supabase**: Supabase client and domain-specific services (matches, players, events, configs)
- **@bf2-matchmaking/redis**: Redis client with domain abstractions for caching, pub/sub, and data structures
- **@bf2-matchmaking/discord**: Discord.js utilities
- **@bf2-matchmaking/scheduler**: Lightweight setTimeout wrapper with cron support
- **@bf2-matchmaking/logging**: Winston (local) and Logtail (remote) logging wrapper
- **@bf2-matchmaking/utils**: Shared utility functions
- **@bf2-matchmaking/schemas**: Zod schemas generated from Supabase types
- **@bf2-matchmaking/server**: Server-related utilities
- **@bf2-matchmaking/teamspeak**: TeamSpeak integration
- **@bf2-matchmaking/railway**: Railway deployment utilities
- **@bf2-matchmaking/auth**: Authentication utilities
- **@bf2-matchmaking/services**: Shared business logic services

### Data Layer
- **Supabase**: PostgreSQL database, authentication, realtime subscriptions
- **Redis**: Caching, pub/sub messaging, session state

## Key Patterns

- Packages export TypeScript source directly via subpath exports (e.g., `import { hash } from '@bf2-matchmaking/redis/hash'`)
- Apps use `nodemon` with `ts-node` for development, watching both local `src/` and `../../packages/**/*`
- Production builds use `esbuild` for api/engine
- Environment variables loaded via `dotenv/config` at app entry points
- Each app has its own `.env` file (not committed)

## Environment Variables

Key environment variables needed:
- `DISCORD_TOKEN`: Discord bot token
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase connection
- `REDIS_URL`: Redis connection
- `LOGTAIL_SOURCE`, `LOGTAIL_HOST`: Remote logging
