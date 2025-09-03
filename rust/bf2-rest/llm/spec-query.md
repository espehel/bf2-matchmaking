You are an senior Rust developer. You will help me define what I need to build rust apps for debian.

I want a very lightweight rest api running on a debian server communicating with a battlefield 2 server process. It should expose endpoints for restarting the process, uploading configuration files and giving rcon commmands over a tcp socket. The api should be secured with a simple token based authentication.

Use axum to create the rest api.

This script is an example shell script used to restart the battlefield 2 server process: https://raw.githubusercontent.com/rkantos/bf2-matchmaking/refs/heads/main/scripts/restart-bf2.sh

this an exeample script in node.js used to connect to the rcon socket: https://raw.githubusercontent.com/espehel/bf2-matchmaking/refs/heads/main/packages/services/src/rcon/socket-manager.ts

This is my general idea. Your goal is not to implement this idea but to translate my idea into a clear, high-level goal and implementation plan for another coding agent to implement. To do this, you should research the best tech stack to follow implementation and what kind of API service is needed, as well as consider my preferences. 
