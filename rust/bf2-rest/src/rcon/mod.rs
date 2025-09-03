use anyhow::{anyhow, Context, Result};
use dashmap::DashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::time::timeout;
use tracing::{debug, error, info, warn};

const CONNECTION_TTL: Duration = Duration::from_secs(300); // 5 minutes

#[derive(Debug, Clone)]
pub struct RconConfig {
    pub host: String,
    pub port: u16,
    pub password: String,
    pub timeout: Duration,
}

struct RconConnection {
    stream: BufReader<TcpStream>,
    authenticated: bool,
    last_used: Instant,
}

pub struct RconClient {
    config: RconConfig,
    connections: Arc<DashMap<String, RconConnection>>,
}

impl RconClient {
    pub fn new(config: RconConfig) -> Self {
        Self {
            config,
            connections: Arc::new(DashMap::new()),
        }
    }

    /// Send a command to the RCON server
    pub async fn send_command(&self, command: &str) -> Result<String> {
        let key = format!("{}:{}", self.config.host, self.config.port);
        
        // Try to get existing connection
        let mut connection = self.get_or_create_connection(&key).await?;
        
        // Send command and read response
        match self.execute_command(&mut connection, command).await {
            Ok(response) => {
                // Update connection in cache
                self.connections.insert(key, connection);
                Ok(response)
            }
            Err(e) => {
                // Remove failed connection from cache
                self.connections.remove(&key);
                // Try once more with a fresh connection
                warn!("RCON command failed, retrying with new connection: {}", e);
                let mut new_connection = self.create_connection().await?;
                let response = self.execute_command(&mut new_connection, command).await?;
                self.connections.insert(key, new_connection);
                Ok(response)
            }
        }
    }

    async fn get_or_create_connection(&self, key: &str) -> Result<RconConnection> {
        // Check if we have a valid cached connection
        if let Some(entry) = self.connections.get(key) {
            let connection = entry.value();
            if connection.last_used.elapsed() < CONNECTION_TTL && connection.authenticated {
                // For simplicity, we'll create a new connection instead of trying to clone
                // In a production system, you might want to implement a proper connection pool
                // with reference counting or a different architecture
            } else {
                // Remove expired connection
                self.connections.remove(key);
            }
        }
        
        // Remove expired connection
        self.connections.remove(key);
        
        // Create new connection
        self.create_connection().await
    }

    async fn create_connection(&self) -> Result<RconConnection> {
        debug!("Creating new RCON connection to {}:{}", self.config.host, self.config.port);
        
        let addr = format!("{}:{}", self.config.host, self.config.port);
        let stream = timeout(self.config.timeout, TcpStream::connect(&addr))
            .await
            .context("Connection timeout")?
            .context("Failed to connect to RCON server")?;

        let mut buf_reader = BufReader::new(stream);
        
        // Authenticate
        self.authenticate(&mut buf_reader).await?;
        
        Ok(RconConnection {
            stream: buf_reader,
            authenticated: true,
            last_used: Instant::now(),
        })
    }

    async fn authenticate(&self, stream: &mut BufReader<TcpStream>) -> Result<()> {
        debug!("Starting RCON authentication");
        
        // Read the banner line to get the digest seed
        let mut banner = String::new();
        timeout(self.config.timeout, stream.read_line(&mut banner))
            .await
            .context("Timeout reading RCON banner")?
            .context("Failed to read RCON banner")?;

        debug!("Received RCON banner: {}", banner.trim());

        // Extract seed from banner: "### Digest seed: <seed>"
        let seed = self.extract_seed_from_banner(&banner)?;
        
        // Compute MD5 hash of seed + password
        let digest = format!("{:x}", md5::compute(format!("{}{}", seed, self.config.password)));
        
        // Send login command
        let login_cmd = format!("login {}\n", digest);
        timeout(self.config.timeout, stream.write_all(login_cmd.as_bytes()))
            .await
            .context("Timeout sending login command")?
            .context("Failed to send login command")?;
        
        // Read authentication response
        let mut response = String::new();
        timeout(self.config.timeout, stream.read_line(&mut response))
            .await
            .context("Timeout reading authentication response")?
            .context("Failed to read authentication response")?;

        debug!("Authentication response: {}", response.trim());
        
        if response.to_lowercase().contains("authentication successful") {
            info!("RCON authentication successful");
            Ok(())
        } else {
            Err(anyhow!("RCON authentication failed: {}", response.trim()))
        }
    }

    fn extract_seed_from_banner(&self, banner: &str) -> Result<String> {
        // Parse banner like: "### Digest seed: abcd1234"
        if let Some(seed_start) = banner.find("### Digest seed: ") {
            let seed_part = &banner[seed_start + 17..];
            let seed = seed_part.trim().to_string();
            if !seed.is_empty() {
                debug!("Extracted RCON seed: {}", seed);
                return Ok(seed);
            }
        }
        
        Err(anyhow!("Could not extract seed from RCON banner: {}", banner))
    }

    async fn execute_command(&self, connection: &mut RconConnection, command: &str) -> Result<String> {
        debug!("Executing RCON command: {}", command);
        
        // Send command
        let cmd_with_newline = format!("{}\n", command);
        timeout(
            self.config.timeout,
            connection.stream.write_all(cmd_with_newline.as_bytes())
        )
        .await
        .context("Timeout sending command")?
        .context("Failed to send command")?;

        // Read response (may be multiple lines)
        let mut response = String::new();
        let mut buffer = String::new();
        
        // Read lines until we get an empty line or timeout
        loop {
            buffer.clear();
            match timeout(self.config.timeout, connection.stream.read_line(&mut buffer)).await {
                Ok(Ok(0)) => break, // EOF
                Ok(Ok(_)) => {
                    if buffer.trim().is_empty() {
                        break; // Empty line indicates end of response
                    }
                    response.push_str(&buffer);
                }
                Ok(Err(e)) => return Err(anyhow!("Error reading response: {}", e)),
                Err(_) => {
                    warn!("Timeout reading RCON response, using partial response");
                    break;
                }
            }
            
            // Prevent infinite loops
            if response.len() > 65536 {
                warn!("RCON response too large, truncating");
                break;
            }
        }

        debug!("RCON response: {}", response.trim());
        connection.last_used = Instant::now();
        
        Ok(response)
    }

    /// Convenience method for getting user list
    pub async fn get_users(&self) -> Result<String> {
        self.send_command("users").await
    }

    /// Clean up expired connections
    pub async fn cleanup_expired_connections(&self) {
        let expired_keys: Vec<String> = self.connections
            .iter()
            .filter_map(|entry| {
                let (key, connection) = entry.pair();
                if connection.last_used.elapsed() > CONNECTION_TTL {
                    Some(key.clone())
                } else {
                    None
                }
            })
            .collect();

        for key in expired_keys {
            debug!("Removing expired RCON connection: {}", key);
            self.connections.remove(&key);
        }
    }
}