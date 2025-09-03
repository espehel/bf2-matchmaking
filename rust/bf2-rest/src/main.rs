mod auth;
mod config;
mod handlers;
mod rcon;
mod utils;

use anyhow::{Context, Result};
use axum::{
    extract::DefaultBodyLimit,
    http::{Method, StatusCode},
    middleware,
    response::Json,
    routing::{get, post},
    Extension, Router,
};
use serde_json::{json, Value};
use std::{sync::Arc, time::Duration};
use tokio::signal;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::{DefaultMakeSpan, TraceLayer},
};
use tracing::{error, info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use auth::{create_rate_limit_layer, handle_rate_limit_error};
use config::Config;
use handlers::{
    health_handler, restart_handler, rcon_command_handler, rcon_users_handler, status_handler,
    upload_config_handler, AppState,
};
use rcon::{RconClient, RconConfig};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "bf2_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting BF2 API Server...");

    // Load configuration
    let config = Config::load().context("Failed to load configuration")?;
    info!("Loaded configuration from file");

    // Validate paths
    if !config.paths.restart_script.exists() {
        error!("Restart script not found: {:?}", config.paths.restart_script);
        std::process::exit(1);
    }

    if !config.paths.config_dir.exists() {
        error!("Config directory not found: {:?}", config.paths.config_dir);
        std::process::exit(1);
    }

    // Create RCON client
    let rcon_config = RconConfig {
        host: config.rcon.host.clone(),
        port: config.rcon.port,
        password: config.rcon.password.clone(),
        timeout: Duration::from_secs(config.rcon.timeout_secs),
    };
    let rcon_client = RconClient::new(rcon_config);

    // Test RCON connection
    match rcon_client.send_command("echo BF2 API Starting").await {
        Ok(response) => info!("RCON connection test successful: {}", response.trim()),
        Err(e) => warn!("RCON connection test failed (will retry later): {}", e),
    }

    // Create application state
    let app_state = AppState {
        config: config.clone(),
        rcon_client,
    };

    // Build the application router
    let app = create_app(app_state, config.security.token.clone()).await;

    // Create server
    let listener = tokio::net::TcpListener::bind(&config.api.bind)
        .await
        .with_context(|| format!("Failed to bind to {}", config.api.bind))?;

    info!("BF2 API Server listening on {}", config.api.bind);
    info!("API endpoints:");
    info!("  GET  /health");
    info!("  GET  /status");
    info!("  POST /restart");
    info!("  POST /configs/upload");
    info!("  POST /rcon/command");
    info!("  POST /rcon/users");

    // Run the server with graceful shutdown
    axum::serve(
        listener, 
        app.into_make_service_with_connect_info::<std::net::SocketAddr>()
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .context("Server error")?;

    info!("BF2 API Server shut down gracefully");
    Ok(())
}

async fn create_app(app_state: AppState, api_token: String) -> Router {
    // Create authentication middleware that has access to the token
    let auth_middleware = {
        let token = api_token.clone();
        middleware::from_fn(move |req, next| {
            let token = token.clone();
            auth::auth_middleware(req.headers().clone(), req, next, token)
        })
    };

    // Create rate limiting layer
    let rate_limit_layer = create_rate_limit_layer();

    Router::new()
        // Public health endpoint (no auth required)
        .route("/health", get(health_handler))
        // Protected endpoints
        .route("/status", get(status_handler))
        .route("/restart", post(restart_handler))
        .route("/configs/upload", post(upload_config_handler))
        .route("/rcon/command", post(rcon_command_handler))
        .route("/rcon/users", post(rcon_users_handler))
        // Middleware stack (applied in reverse order)
        .layer(
            ServiceBuilder::new()
                // Error handling for rate limiting
                .map_err(handle_rate_limit_error)
                // Rate limiting
                .layer(rate_limit_layer)
                // Authentication (except for /health)
                .layer(middleware::from_fn(move |req, next| {
                    let uri = req.uri().clone();
                    let token = api_token.clone();
                    async move {
                        // Skip auth for health endpoint
                        if uri.path() == "/health" {
                            return next.run(req).await;
                        }
                        auth::auth_middleware_with_token(req, next, token).await
                    }
                }))
                // Request tracing
                .layer(
                    TraceLayer::new_for_http()
                        .make_span_with(DefaultMakeSpan::default().include_headers(true))
                )
                // CORS
                .layer(
                    CorsLayer::new()
                        .allow_methods([Method::GET, Method::POST])
                        .allow_headers(tower_http::cors::Any)
                        .allow_origin(tower_http::cors::Any)
                )
                // Body size limit for uploads (10MB)
                .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        )
        // Global error handler
        .fallback(fallback_handler)
        // Application state
        .with_state(app_state)
}

async fn fallback_handler() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({
            "error": "Not Found",
            "message": "The requested endpoint does not exist"
        })),
    )
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl+C, shutting down...");
        }
        _ = terminate => {
            info!("Received SIGTERM, shutting down...");
        }
    }
}