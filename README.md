# BF2 Matchmaking

## Structure

Monorepo built with turborepo and dependencies handled by NPM.

### Apps

#### bot

Discord bot for listening to matches being arranged in discord.

#### engine

Handle automation of matches

#### platform

Sets up and tear down BF2 servers

#### rcon

Communicating with live servers and links them to live matches.

#### web

Web app where users can interact with matches, see scores and stats, set up teams and plan matches.

### packages

#### discord

Utility functions for interaction with discord

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
