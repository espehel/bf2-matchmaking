# Multi-stage build for minimal final image
FROM rust:1.75-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy dependency files first for better caching
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src/ ./src/

# Build the application in release mode
RUN cargo build --release

# Runtime stage with minimal base image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r bf2api \
    && useradd -r -g bf2api -d /opt/bf2-api -s /sbin/nologin bf2api

# Create necessary directories
RUN mkdir -p /opt/bf2-api /etc/bf2-api /var/log/bf2-api \
    && chown -R bf2api:bf2api /opt/bf2-api /var/log/bf2-api

# Copy binary from builder stage
COPY --from=builder /app/target/release/bf2-api /opt/bf2-api/bf2-api

# Copy configuration files
COPY config.toml /etc/bf2-api/config.toml.example
COPY environment /etc/bf2-api/environment.example

# Set proper permissions
RUN chown -R bf2api:bf2api /etc/bf2-api \
    && chmod 755 /opt/bf2-api/bf2-api \
    && chmod 644 /etc/bf2-api/*.example

# Switch to non-root user
USER bf2api

# Set working directory
WORKDIR /opt/bf2-api

# Environment variables
ENV CONFIG_PATH=/etc/bf2-api/config.toml
ENV RUST_LOG=bf2_api=info,tower_http=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./bf2-api"]