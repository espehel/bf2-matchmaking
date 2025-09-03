#!/bin/bash
set -euo pipefail

# BF2 API Build and Installation Script

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/bf2-api"
CONFIG_DIR="/etc/bf2-api"
LOG_DIR="/var/log/bf2-api"
SERVICE_USER="bf2api"
SERVICE_GROUP="bf2api"

echo "=== BF2 API Build and Installation ==="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Build the project
echo "Building BF2 API..."
cd "$PROJECT_DIR"
cargo build --release

echo "Creating system user and directories..."

# Create service user and group
if ! getent group "$SERVICE_GROUP" >/dev/null; then
    groupadd --system "$SERVICE_GROUP"
    echo "Created group: $SERVICE_GROUP"
fi

if ! getent passwd "$SERVICE_USER" >/dev/null; then
    useradd --system --gid "$SERVICE_GROUP" --home-dir "$TARGET_DIR" \
            --shell /sbin/nologin --comment "BF2 API Service" "$SERVICE_USER"
    echo "Created user: $SERVICE_USER"
fi

# Create directories
mkdir -p "$TARGET_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "/home/bf2/server-configs"

# Install binary
echo "Installing binary..."
cp "target/release/bf2-api" "$TARGET_DIR/"
chmod 755 "$TARGET_DIR/bf2-api"
chown "$SERVICE_USER:$SERVICE_GROUP" "$TARGET_DIR/bf2-api"

# Install configuration files
echo "Installing configuration files..."
if [[ ! -f "$CONFIG_DIR/config.toml" ]]; then
    cp "config.toml" "$CONFIG_DIR/"
    echo "Installed default config.toml - PLEASE CUSTOMIZE IT!"
else
    echo "Config file already exists, not overwriting"
fi

if [[ ! -f "$CONFIG_DIR/environment" ]]; then
    cp "environment" "$CONFIG_DIR/"
    echo "Installed environment file"
fi

# Set permissions
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$CONFIG_DIR"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$LOG_DIR"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$TARGET_DIR"
chmod 600 "$CONFIG_DIR/config.toml"
chmod 644 "$CONFIG_DIR/environment"

# Make bf2api user part of bf2 group for file access
if getent group bf2 >/dev/null; then
    usermod -a -G bf2 "$SERVICE_USER"
    echo "Added $SERVICE_USER to bf2 group"
fi

# Install systemd service
echo "Installing systemd service..."
cp "bf2-api.service" "/etc/systemd/system/"
systemctl daemon-reload

echo "=== Installation Complete ==="
echo ""
echo "Next steps:"
echo "1. Customize the configuration file: $CONFIG_DIR/config.toml"
echo "2. Ensure your restart script is executable: chmod +x /path/to/restart-bf2.sh"
echo "3. Enable and start the service:"
echo "   sudo systemctl enable bf2-api"
echo "   sudo systemctl start bf2-api"
echo "4. Check the service status:"
echo "   sudo systemctl status bf2-api"
echo "5. View logs:"
echo "   sudo journalctl -u bf2-api -f"
echo ""
echo "Security analysis:"
echo "   sudo systemd-analyze security bf2-api"