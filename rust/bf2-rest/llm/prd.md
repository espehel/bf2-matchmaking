Here’s a crisp, “ready-to-build” plan another coding agent can follow.

Goal (high-level)

Build a very lightweight Axum-based REST API that runs on Debian alongside a Battlefield 2 (BF2) server. The API should:
1.	Restart the BF2 server process (delegating to your existing shell script).  ￼
2.	Upload/replace server config files in a controlled directory. (multipart form)  ￼
3.	Send RCON commands over TCP to the BF2 server with the MD5 seed login handshake.  ￼
4.	Be protected by simple token auth (single static token in a header), with optional rate-limiting.  ￼ ￼ ￼

Non-goals: no web UI, no multi-tenant admin, no player-facing features.

⸻

Architecture & Stack

Runtime/OS: Debian 12 (Bookworm), non-root service under systemd with tight unit hardening.  ￼ ￼

Language/Framework:
•	Rust (stable), Axum (HTTP server & routing), Tokio (async runtime), Hyper (HTTP), Tower (middleware). Axum provides first-class middleware and multipart support.  ￼

Core crates:
•	axum, tokio, hyper, tower, tower-http, serde/serde_json, tracing/tracing-subscriber, anyhow (or color-eyre).
•	tower-governor for simple, generic rate-limiting layer.  ￼ ￼

Process control: call the existing restart script via tokio::process::Command with a timeout; capture stdout/stderr; return exit status.  ￼ ￼ ￼

RCON client (in-process): custom, minimal async client using tokio::net::TcpStream.
•	Connect to TCP :4711 (default) unless overridden.
•	On banner, read ### Digest seed: <seed>, send login <md5(seed+password)>, then allow users / exec ... payloads. (All terminated by \n.)  ￼
•	The Node example in your repo shows the exact seed→MD5 login handshake and simple send/receive loop—replicate that behavior in Rust.  ￼

Network posture: run API on localhost or behind NGINX/Caddy with TLS; host firewall allows only required ports (e.g., 443 to proxy; BF2 RCON 4711 TCP open internally as needed). UFW is fine for simple host firewall management on Debian.  ￼ ￼

⸻

API surface (minimal & opinionated)

Authentication: Authorization: Bearer <TOKEN> or X-API-Token: <TOKEN> (choose one; reject otherwise). Implement as Axum middleware.  ￼

Health/Status
•	GET /health → 200 { "ok": true }
•	GET /status → queries RCON users (or another safe command) and process state; return summary JSON.  ￼

Process control
•	POST /restart (JSON: { "profile": "vehicles|bf2top|inf", "mapName": "...", "serverName": "..." })
•	Runs your restart-bf2.sh with validated args; 60–120s timeout; returns { "status": "restarted", "stdout": "...", "stderr": "...", "code": 0 }. (Script already edits XML, backs up, uses screen & mono.)  ￼

Config management
•	POST /configs/upload (multipart form)
•	Accepts specific allow-listed filenames (e.g., *.profile, *.con, *.cfg, etc.).
•	Writes atomically into a configured directory (/home/bf2/server or similar), sets owner bf2:bf2, and keeps a timestamped backup. Use Axum’s Multipart extractor.  ￼

RCON
•	POST /rcon/command (JSON: { "command": "exec admin.kickPlayer 3" })
•	Reuses a small connection pool keyed by <host:port> with TTL; lazy reconnect on failure.
•	Response is raw text: { "output": "..." }.
•	Optional convenience: POST /rcon/users (no body) → runs users.  ￼

⸻

Security model (simple & strict)
•	Static token checked by middleware on every request; reject if missing/invalid. (No JWT required.)  ￼
•	Rate-limit (e.g., 10 req/10s per IP) with tower-governor.  ￼ ￼
•	systemd hardening for the API unit: NoNewPrivileges=yes, PrivateTmp=yes, ProtectSystem=strict, ProtectHome=read-only, RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6, CapabilityBoundingSet=, AmbientCapabilities= (empty), ReadWritePaths=/home/bf2/server-configs (narrow), etc. Use systemd-analyze security to iterate.  ￼ ￼
•	Firewall: only expose the API through localhost or a TLS reverse proxy; allow BF2 RCON port 4711/TCP as needed (ideally local only).  ￼

⸻

Configuration & Files
•	Config file /etc/bf2-api/config.toml (read at startup):
•	api.bind = "127.0.0.1:8080"
•	security.token = "…", security.allowlist = ["10.0.0.0/24"] (optional)
•	rcon.host = "127.0.0.1", rcon.port = 4711, rcon.password = "..."
•	paths.restart_script = "/opt/bf2/scripts/restart-bf2.sh"
•	paths.config_dir = "/home/bf2/server"
•	Permissions: API service user (e.g., bf2api) has read/write only to config_dir and execute permission on restart-bf2.sh. Script itself continues to control BF2 via screen/mono.  ￼

⸻

RCON client behavior (Rust replication of the Node script)
1.	Connect to host:port (default 4711/TCP).  ￼
2.	On banner line ### Digest seed: <seed>, compute md5(seed + password) and send login <digest>\n.  ￼
3.	On “Authentication successful”, mark socket as ready; on “failed”, error.
4.	For each command: socket.write(cmd + "\n"), read one response, enforce timeout, return as string. (Matches your Node socket-manager.ts semantics.)  ￼

⸻

Systemd units (two services)
1.	bf2-api.service (Rust binary) with the hardening options above and EnvironmentFile=/etc/bf2-api/config.  ￼
2.	(Optional) bf2-server.service if you choose to migrate from screen to systemd for the BF2 daemon later; for now, keep using your script and just invoke it via the API.  ￼

⸻

Operational flow
•	Restart: API validates payload → runs restart-bf2.sh → streams/captures output → returns JSON summary.  ￼
•	Upload: multipart accept → filename & path allow-list → atomic replace with backup → optional quick syntax validation (e.g., ensure XML well-formedness if touching .profile).  ￼
•	RCON: token check → get/reuse socket → send exec … or users → return response; reconnect on errors.  ￼

⸻

Acceptance criteria
•	With a valid token:
•	GET /health returns 200.
•	POST /rcon/command {"command":"users"} returns a non-empty string on a running server.  ￼
•	POST /restart successfully restarts via the provided script (non-zero exit code surfaces as 5xx + body).  ￼
•	POST /configs/upload replaces a test config and leaves a timestamped backup.  ￼
•	With an invalid/missing token: all endpoints return 401/403.  ￼
•	Rate limiting produces 429 when hammering the API.  ￼
•	systemd-analyze security bf2-api.service shows a “good” hardening score; only the required ReadWritePaths and AF_INET/AF_INET6 are open.  ￼

⸻

Risks & mitigations
•	RCON exposure: Limit to localhost, or firewall to trusted IPs. Default port 4711 is widely known.  ￼
•	Script fragility: restart-bf2.sh assumes specific paths/users (~bf2, screen, mono). Keep API-side timeouts and clear error propagation; document required env vars (BF2SERVERUSER, etc.).  ￼
•	Path traversal on uploads: enforce allow-list & normalize paths; write only under config_dir. (Axum Multipart provides raw bytes; you control the write path.)  ￼

⸻

Work breakdown (hand-off to implementation agent)
1.	Scaffold Axum service with health route, JSON error handling, tracing setup.  ￼
2.	Auth middleware: static token check; add tower-governor layer.  ￼ ￼
3.	RCON client module: implement handshake/login/command; connection cache + TTL + timeouts; config params. Mirror Node behavior.  ￼ ￼
4.	Restart route: spawn restart-bf2.sh with controlled args; capture output; timeout.  ￼ ￼
5.	Upload route: multipart parsing, allow-listed filenames, atomic replace with backup.  ￼
6.	Status route: call RCON users + small process check; aggregate to JSON.  ￼
7.	systemd unit with hardening; UFW rules; (optional) reverse proxy TLS. Validate via systemd-analyze security.  ￼ ￼ ￼
8.	Smoke tests with curl and a mocked RCON (or a real server in staging).  ￼

⸻

If you want, I can convert this into a stub repo structure (folders, Cargo.toml, sample unit file, and endpoint stubs) next.
