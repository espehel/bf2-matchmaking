use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::path::PathBuf;
use anyhow::{Context, Result};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub api: ApiConfig,
    pub security: SecurityConfig,
    pub rcon: RconConfig,
    pub paths: PathsConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApiConfig {
    pub bind: SocketAddr,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SecurityConfig {
    pub token: String,
    pub allowlist: Option<Vec<String>>, // CIDR blocks like "10.0.0.0/24"
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RconConfig {
    pub host: String,
    pub port: u16,
    pub password: String,
    pub timeout_secs: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PathsConfig {
    pub restart_script: PathBuf,
    pub config_dir: PathBuf,
}

impl Config {
    pub fn load() -> Result<Self> {
        let config_path = std::env::var("CONFIG_PATH")
            .unwrap_or_else(|_| "/etc/bf2-api/config.toml".to_string());
        
        let content = std::fs::read_to_string(&config_path)
            .with_context(|| format!("Failed to read config file: {}", config_path))?;
        
        let config: Config = toml::from_str(&content)
            .with_context(|| "Failed to parse config file")?;
        
        tracing::info!("Configuration loaded successfully from {}", config_path);
        Ok(config)
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            api: ApiConfig {
                bind: "127.0.0.1:8080".parse().unwrap(),
            },
            security: SecurityConfig {
                token: "your-secret-token-here".to_string(),
                allowlist: None,
            },
            rcon: RconConfig {
                host: "127.0.0.1".to_string(),
                port: 4711,
                password: "your-rcon-password".to_string(),
                timeout_secs: 10,
            },
            paths: PathsConfig {
                restart_script: PathBuf::from("/opt/bf2/scripts/restart-bf2.sh"),
                config_dir: PathBuf::from("/home/bf2/server"),
            },
        }
    }
}