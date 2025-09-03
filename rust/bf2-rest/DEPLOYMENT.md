# BF2 API Deployment Guide

This guide covers deployment scenarios for the BF2 Server Management API.

## Standard Debian Deployment (Recommended)

### System Requirements
- Debian 12 (Bookworm) or compatible Linux distribution
- Rust toolchain (for building from source)
- systemd for service management
- Existing BF2 server with RCON enabled

### Step-by-Step Deployment

1. **Prepare the System**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Rust (if building from source)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   
   # Create necessary directories
   sudo mkdir -p /opt/bf2-api /etc/bf2-api /var/log/bf2-api
   ```

2. **Deploy the Application**
   ```bash
   # Build and install
   git clone <repository-url>
   cd bf2-api
   sudo ./install.sh
   ```

3. **Configure the Service**
   ```bash
   # Edit configuration
   sudo vim /etc/bf2-api/config.toml
   
   # Set proper API token and RCON credentials
   # Update paths to match your BF2 installation
   ```

4. **Configure Firewall**
   ```bash
   # Allow API port (if needed externally)
   sudo ufw allow 8080/tcp
   
   # Ensure RCON port is accessible internally
   sudo ufw allow from 127.0.0.1 to any port 4711
   ```

5. **Start and Enable Service**
   ```bash
   sudo systemctl enable bf2-api
   sudo systemctl start bf2-api
   sudo systemctl status bf2-api
   ```

6. **Verify Installation**
   ```bash
   # Test health endpoint
   curl http://localhost:8080/health
   
   # Run full test suite
   ./test-api.sh --token "your-api-token"
   ```

## Reverse Proxy Setup (Production)

For production deployments, run the API behind a reverse proxy with TLS.

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/bf2/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
    }
}
```

### Caddy Configuration

```caddyfile
your-domain.com {
    reverse_proxy /api/bf2/* localhost:8080
    
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
    }
}
```

## Docker Deployment (Optional)

For containerized deployment, a Dockerfile is provided:

```bash
# Build container
docker build -t bf2-api:latest .

# Run container
docker run -d \
  --name bf2-api \
  --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -v /etc/bf2-api:/etc/bf2-api:ro \
  -v /home/bf2/server:/home/bf2/server:rw \
  -v /opt/bf2/scripts:/opt/bf2/scripts:ro \
  bf2-api:latest
```

## Security Hardening

### Additional systemd Security

Edit `/etc/systemd/system/bf2-api.service` to add more restrictions:

```ini
[Service]
# Additional hardening
ProtectProc=invisible
ProcSubset=pid
PrivateUsers=yes
ProtectHostname=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectClock=yes

# Restrict system calls further
SystemCallFilter=@system-service
SystemCallFilter=~@debug @mount @cpu-emulation @obsolete @privileged @reboot @swap @raw-io
```

### Network Security

1. **Firewall Rules (UFW)**
   ```bash
   # Allow only necessary connections
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow from 192.168.1.0/24 to any port 8080
   sudo ufw enable
   ```

2. **Fail2ban Integration**
   Create `/etc/fail2ban/jail.local`:
   ```ini
   [bf2-api]
   enabled = true
   port = 8080
   filter = bf2-api
   logpath = /var/log/bf2-api/access.log
   maxretry = 5
   bantime = 3600
   ```

### Monitoring Setup

1. **Prometheus Metrics** (if implementing)
   The API can be extended with metrics endpoints for monitoring.

2. **Log Monitoring**
   ```bash
   # Monitor logs in real-time
   sudo journalctl -u bf2-api -f
   
   # Set up log rotation
   sudo vim /etc/logrotate.d/bf2-api
   ```

## Performance Tuning

### System Limits

Edit `/etc/security/limits.conf`:
```
bf2api soft nofile 4096
bf2api hard nofile 8192
bf2api soft nproc 1024
bf2api hard nproc 2048
```

### Service Configuration

Adjust `/etc/systemd/system/bf2-api.service`:
```ini
[Service]
# Resource limits
LimitNOFILE=4096
LimitNPROC=1024
LimitAS=536870912  # 512MB memory limit

# Performance settings
IOSchedulingClass=2
IOSchedulingPriority=4
CPUSchedulingPolicy=2
```

## Backup and Recovery

### Configuration Backup
```bash
# Create backup script
sudo cp /etc/bf2-api/config.toml /backup/bf2-api-config-$(date +%Y%m%d).toml
sudo cp -r /home/bf2/server /backup/bf2-server-configs-$(date +%Y%m%d)/
```

### Service Recovery
```bash
# Service recovery procedure
sudo systemctl stop bf2-api
sudo cp /backup/bf2-api-config-latest.toml /etc/bf2-api/config.toml
sudo systemctl start bf2-api
sudo systemctl status bf2-api
```

## Troubleshooting Common Issues

### Service Won't Start
1. Check configuration syntax: `sudo bf2-api --check-config`
2. Verify file permissions: `ls -la /etc/bf2-api/`
3. Check system logs: `sudo journalctl -u bf2-api -n 50`

### RCON Connection Issues
1. Test RCON manually: `telnet localhost 4711`
2. Verify BF2 server RCON settings
3. Check network connectivity and firewall rules

### High Resource Usage
1. Monitor with: `sudo systemd-cgtop`
2. Adjust connection pool settings in configuration
3. Review systemd resource limits

## Maintenance

### Regular Tasks
- Review logs weekly: `sudo journalctl -u bf2-api --since "1 week ago"`
- Update API token quarterly
- Review and update firewall rules
- Monitor system resource usage
- Test backup and recovery procedures

### Updates
```bash
# Update process
sudo systemctl stop bf2-api
cd bf2-api
git pull
cargo build --release
sudo cp target/release/bf2-api /opt/bf2-api/
sudo systemctl start bf2-api
```