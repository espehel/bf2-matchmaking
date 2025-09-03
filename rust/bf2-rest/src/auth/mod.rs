use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorLayer,
};
use tracing::{debug, warn};

/// Authentication middleware that checks for valid API token
pub async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = extract_token_from_headers(&headers)?;
    
    // Get the expected token from app state (will be injected by the main app)
    let expected_token = request
        .extensions()
        .get::<String>()
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    if token != expected_token {
        warn!("Invalid API token provided");
        return Err(StatusCode::UNAUTHORIZED);
    }

    debug!("API token validated successfully");
    Ok(next.run(request).await)
}

/// Extract token from Authorization header (Bearer) or X-API-Token header
fn extract_token_from_headers(headers: &HeaderMap) -> Result<String, StatusCode> {
    // Try Authorization: Bearer <token> first
    if let Some(auth_header) = headers.get("authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return Ok(token.to_string());
            }
        }
    }

    // Try X-API-Token header
    if let Some(token_header) = headers.get("x-api-token") {
        if let Ok(token) = token_header.to_str() {
            return Ok(token.to_string());
        }
    }

    warn!("No valid authentication token found in headers");
    Err(StatusCode::UNAUTHORIZED)
}

/// Create rate limiting layer (10 requests per 10 seconds per IP)
pub fn create_rate_limit_layer() -> GovernorLayer<SmartIpKeyExtractor> {
    let governor_conf = Box::new(
        GovernorConfigBuilder::default()
            .per_second(1) // 1 request per second
            .burst_size(10) // Allow burst of 10 requests
            .finish()
            .unwrap(),
    );

    GovernorLayer {
        config: governor_conf.into(),
    }
}

/// Error handler for rate limiting
pub async fn handle_rate_limit_error(
    _err: tower_governor::GovernorError,
) -> Result<Json<Value>, StatusCode> {
    warn!("Rate limit exceeded");
    Ok(Json(json!({
        "error": "Too many requests",
        "message": "Rate limit exceeded. Please try again later."
    })))
}

/// Authentication middleware with token parameter
pub async fn auth_middleware_with_token(
    request: Request,
    next: Next,
    expected_token: String,
) -> Result<Response, StatusCode> {
    let headers = request.headers().clone();
    let token = extract_token_from_headers(&headers)?;

    if token != expected_token {
        warn!("Invalid API token provided");
        return Err(StatusCode::UNAUTHORIZED);
    }

    debug!("API token validated successfully");
    Ok(next.run(request).await)
}

/// Custom extractor for client IP (for rate limiting)
pub struct ClientIp(pub SocketAddr);

impl<S> axum::extract::FromRequestParts<S> for ClientIp
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let connect_info = parts
            .extensions
            .get::<axum::extract::ConnectInfo<SocketAddr>>()
            .ok_or((StatusCode::INTERNAL_SERVER_ERROR, "No connection info"))?;

        Ok(ClientIp(connect_info.0))
    }
}