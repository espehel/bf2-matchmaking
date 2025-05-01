# BF2 Matchmaking
The code behind https://bf2.top/

## Structure

Monorepo built with turborepo and dependencies handled by NPM.

### Apps

#### bot

Discord bot for listening to matches being arranged in discord.

#### engine

The core of the system, scheduling automation jobs, hosting discord and teamspeak bots, handling match and server states. 

#### api

Hosting apis. Platform api to create and delete bf2 servers, rcon api to interact with running servers, and api's for changing the player, match and server models.

#### web

Web app where users can interact with matches, see scores and stats, set up teams and plan matches.

### packages

### redis
Utility functions wrapping core api and domain specific functions.

#### discord

Utility functions for interaction with discord

### scheduler

Very lightweight scheduler wrapping setTimeout. Supports time intervals and cron notation.

#### logging

Wrapping logg functions, locally with winston and remote with logtail

#### supabase

Api and services to simplify communication supabase with supabase.

#### types

Typescript typings

#### utils

Minor util files and functions, not big enough for its own package.

### Default ports

- bot: 5001
- engine: 5004
- platform: 5003
- rcon: 5002
- web: 5005
