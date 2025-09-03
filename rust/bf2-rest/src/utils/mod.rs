use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use tokio::fs::{File, OpenOptions};
use tokio::io::AsyncWriteExt;
use tracing::{debug, info};

/// Validate filename against allowed extensions and prevent path traversal
pub fn validate_filename(filename: &str, allowed_extensions: &[&str]) -> bool {
    // Check for path traversal attempts
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return false;
    }

    // Check if filename has an allowed extension
    allowed_extensions.iter().any(|ext| filename.ends_with(ext))
}

/// Create a timestamped backup of a file
pub async fn backup_file(original_path: &Path) -> Result<PathBuf> {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!(
        "{}.backup.{}",
        original_path.file_name().unwrap().to_string_lossy(),
        timestamp
    );
    
    let backup_path = original_path.parent().unwrap().join(backup_name);
    
    tokio::fs::copy(original_path, &backup_path)
        .await
        .with_context(|| format!("Failed to create backup: {:?}", backup_path))?;
    
    info!("Created backup: {:?}", backup_path);
    Ok(backup_path)
}

/// Write file contents atomically using a temporary file
pub async fn write_file_atomically(target_path: &Path, data: &[u8]) -> Result<()> {
    let temp_path = target_path.with_extension("tmp");
    
    // Write to temporary file first
    {
        let mut temp_file = File::create(&temp_path)
            .await
            .with_context(|| format!("Failed to create temp file: {:?}", temp_path))?;
        
        temp_file.write_all(data)
            .await
            .with_context(|| "Failed to write to temp file")?;
        
        temp_file.sync_all()
            .await
            .with_context(|| "Failed to sync temp file")?;
    }
    
    // Atomically move temp file to target
    tokio::fs::rename(&temp_path, target_path)
        .await
        .with_context(|| format!("Failed to move temp file to target: {:?}", target_path))?;
    
    debug!("Atomically wrote file: {:?}", target_path);
    Ok(())
}

/// Validate and normalize a directory path
pub fn validate_config_dir(path: &Path) -> Result<PathBuf> {
    let canonical = path.canonicalize()
        .with_context(|| format!("Config directory does not exist: {:?}", path))?;
    
    if !canonical.is_dir() {
        return Err(anyhow::anyhow!("Config path is not a directory: {:?}", canonical));
    }
    
    Ok(canonical)
}

/// Check if a path is within the allowed config directory (prevent path traversal)
pub fn is_path_safe(target_path: &Path, allowed_dir: &Path) -> bool {
    if let (Ok(target), Ok(allowed)) = (target_path.canonicalize(), allowed_dir.canonicalize()) {
        target.starts_with(allowed)
    } else {
        false
    }
}

/// Sanitize command arguments to prevent injection attacks
pub fn sanitize_shell_arg(arg: &str) -> String {
    // Remove or escape potentially dangerous characters
    arg.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == '.' || *c == '/')
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_filename() {
        let allowed = &[".profile", ".con", ".cfg"];
        
        assert!(validate_filename("server.profile", allowed));
        assert!(validate_filename("admin.con", allowed));
        assert!(validate_filename("settings.cfg", allowed));
        
        assert!(!validate_filename("../../../etc/passwd", allowed));
        assert!(!validate_filename("server.txt", allowed));
        assert!(!validate_filename("admin/con", allowed));
        assert!(!validate_filename("test.profile.backup", allowed));
    }

    #[test]
    fn test_sanitize_shell_arg() {
        assert_eq!(sanitize_shell_arg("vehicles"), "vehicles");
        assert_eq!(sanitize_shell_arg("bf2-top"), "bf2-top");
        assert_eq!(sanitize_shell_arg("test; rm -rf /"), "test rm -rf /");
        assert_eq!(sanitize_shell_arg("map_name.zip"), "map_name.zip");
    }
}