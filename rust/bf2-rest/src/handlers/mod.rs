use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::Path;
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::rcon::RconClient;
use crate::utils::{backup_file, validate_filename, write_file_atomically};

// Application state
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub rcon_client: RconClient,
}

// Request/Response types
#[derive(Debug, Deserialize)]
pub struct RestartRequest {
    pub profile: String,
    pub map_name: Option<String>,
    pub server_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RestartResponse {
    pub status: String,
    pub stdout: String,
    pub stderr: String,
    pub code: i32,
}

#[derive(Debug, Deserialize)]
pub struct RconCommandRequest {
    pub command: String,
}

#[derive(Debug, Serialize)]
pub struct RconResponse {
    pub output: String,
}

/// GET /health - Simple health check
pub async fn health_handler() -> Json<Value> {
    Json(json!({ "ok": true }))
}

/// GET /status - Query RCON users and process state
pub async fn status_handler(State(state): State<AppState>) -> Result<Json<Value>, StatusCode> {
    debug!("Status check requested");
    
    let mut status = json!({
        "api": "running",
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    // Try to get RCON users
    match state.rcon_client.get_users().await {
        Ok(users_output) => {
            status["rcon"] = json!({
                "status": "connected",
                "users": users_output.trim()
            });
        }
        Err(e) => {
            warn!("Failed to get RCON users: {}", e);
            status["rcon"] = json!({
                "status": "error",
                "error": e.to_string()
            });
        }
    }

    // Basic process check (check if script exists)
    let script_exists = state.config.paths.restart_script.exists();
    status["restart_script"] = json!({
        "available": script_exists,
        "path": state.config.paths.restart_script.to_string_lossy()
    });

    Ok(Json(status))
}

/// POST /restart - Restart BF2 server using the script
pub async fn restart_handler(
    State(state): State<AppState>,
    Json(payload): Json<RestartRequest>,
) -> Result<Json<RestartResponse>, StatusCode> {
    info!("Server restart requested with profile: {}", payload.profile);

    // Validate profile
    let valid_profiles = ["vehicles", "bf2top", "inf"];
    if !valid_profiles.contains(&payload.profile.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let script_path = &state.config.paths.restart_script;
    
    if !script_path.exists() {
        error!("Restart script not found: {:?}", script_path);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    let mut cmd = Command::new(script_path);
    cmd.arg(&payload.profile);
    
    if let Some(ref map_name) = payload.map_name {
        cmd.arg("--map").arg(map_name);
    }
    
    if let Some(ref server_name) = payload.server_name {
        cmd.arg("--server-name").arg(server_name);
    }

    debug!("Executing restart script: {:?}", cmd);

    // Execute with timeout (120 seconds)
    let timeout_duration = Duration::from_secs(120);
    match timeout(timeout_duration, cmd.output()).await {
        Ok(Ok(output)) => {
            let response = RestartResponse {
                status: if output.status.success() { 
                    "restarted".to_string() 
                } else { 
                    "failed".to_string() 
                },
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                code: output.status.code().unwrap_or(-1),
            };

            if output.status.success() {
                info!("Server restart completed successfully");
            } else {
                warn!("Server restart failed with code: {}", response.code);
            }

            Ok(Json(response))
        }
        Ok(Err(e)) => {
            error!("Failed to execute restart script: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
        Err(_) => {
            error!("Restart script timed out after 120 seconds");
            Err(StatusCode::REQUEST_TIMEOUT)
        }
    }
}

/// POST /configs/upload - Upload and replace config files
pub async fn upload_config_handler(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<Value>, StatusCode> {
    info!("Config file upload requested");

    let mut uploaded_files = Vec::new();
    let allowed_extensions = [".profile", ".con", ".cfg"];

    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let file_name = field
            .file_name()
            .ok_or(StatusCode::BAD_REQUEST)?
            .to_string();

        // Validate filename
        if !validate_filename(&file_name, &allowed_extensions) {
            warn!("Invalid filename rejected: {}", file_name);
            return Err(StatusCode::BAD_REQUEST);
        }

        let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
        
        debug!("Processing upload: {} ({} bytes)", file_name, data.len());

        let target_path = state.config.paths.config_dir.join(&file_name);
        
        // Create backup of existing file
        if target_path.exists() {
            if let Err(e) = backup_file(&target_path).await {
                error!("Failed to create backup for {}: {}", file_name, e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }

        // Write file atomically
        if let Err(e) = write_file_atomically(&target_path, &data).await {
            error!("Failed to write {}: {}", file_name, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

        // Set file ownership to bf2:bf2 (if running with appropriate permissions)
        if let Err(e) = set_bf2_ownership(&target_path).await {
            warn!("Could not set ownership for {}: {}", file_name, e);
        }

        uploaded_files.push(file_name);
    }

    if uploaded_files.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    info!("Successfully uploaded {} file(s): {:?}", uploaded_files.len(), uploaded_files);

    Ok(Json(json!({
        "status": "uploaded",
        "files": uploaded_files,
        "count": uploaded_files.len()
    })))
}

/// POST /rcon/command - Send RCON command
pub async fn rcon_command_handler(
    State(state): State<AppState>,
    Json(payload): Json<RconCommandRequest>,
) -> Result<Json<RconResponse>, StatusCode> {
    debug!("RCON command requested: {}", payload.command);

    match state.rcon_client.send_command(&payload.command).await {
        Ok(output) => {
            debug!("RCON command executed successfully");
            Ok(Json(RconResponse { output }))
        }
        Err(e) => {
            error!("RCON command failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// POST /rcon/users - Convenience endpoint for users command
pub async fn rcon_users_handler(
    State(state): State<AppState>,
) -> Result<Json<RconResponse>, StatusCode> {
    debug!("RCON users command requested");

    match state.rcon_client.get_users().await {
        Ok(output) => {
            debug!("RCON users command executed successfully");
            Ok(Json(RconResponse { output }))
        }
        Err(e) => {
            error!("RCON users command failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Helper function to set file ownership to bf2:bf2
async fn set_bf2_ownership(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    use nix::unistd::{chown, Group, User};
    use std::os::unix::fs::MetadataExt;

    // Try to get bf2 user and group IDs
    let bf2_user = User::from_name("bf2")?;
    let bf2_group = Group::from_name("bf2")?;

    if let (Some(user), Some(group)) = (bf2_user, bf2_group) {
        chown(path, Some(user.uid), Some(group.gid))?;
        debug!("Set ownership of {:?} to bf2:bf2", path);
    } else {
        return Err("bf2 user or group not found".into());
    }

    Ok(())
}