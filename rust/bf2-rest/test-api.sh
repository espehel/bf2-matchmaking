#!/bin/bash
set -euo pipefail

# BF2 API Test Suite

# Configuration
API_BASE="http://127.0.0.1:8080"
API_TOKEN="your-secret-bf2-api-token-change-this"
TEMP_DIR=$(mktemp -d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -e "\n--- Test: ${test_name} ---"
    
    # Run the test command and capture output
    if output=$(eval "$test_command" 2>&1); then
        # Extract HTTP status code
        status_code=$(echo "$output" | grep -o "HTTP/[0-9.]\+ [0-9]\+" | tail -1 | grep -o "[0-9]\+$" || echo "unknown")
        
        if [[ "$status_code" == "$expected_status" ]]; then
            log_info "✅ PASSED - Status: $status_code"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            echo "$output" | grep -v "HTTP/[0-9.]\+ [0-9]\+" || true
        else
            log_error "❌ FAILED - Expected: $expected_status, Got: $status_code"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            echo "$output"
        fi
    else
        log_error "❌ FAILED - Command failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$output"
    fi
}

# Test functions
test_health_endpoint() {
    run_test "Health Check (No Auth Required)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' '$API_BASE/health'" \
        "200"
}

test_health_with_auth() {
    run_test "Health Check (With Valid Token)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' '$API_BASE/health'" \
        "200"
}

test_status_no_auth() {
    run_test "Status Without Auth (Should Fail)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' '$API_BASE/status'" \
        "401"
}

test_status_invalid_auth() {
    run_test "Status With Invalid Token (Should Fail)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer invalid-token' '$API_BASE/status'" \
        "401"
}

test_status_valid_auth() {
    run_test "Status With Valid Token" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' '$API_BASE/status'" \
        "200"
}

test_status_x_api_token() {
    run_test "Status With X-API-Token Header" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'X-API-Token: $API_TOKEN' '$API_BASE/status'" \
        "200"
}

test_rcon_users() {
    run_test "RCON Users Command" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' '$API_BASE/rcon/users' -X POST" \
        "200"
}

test_rcon_custom_command() {
    local test_command='{"command": "echo API Test"}'
    
    run_test "RCON Custom Command" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' -H 'Content-Type: application/json' -d '$test_command' '$API_BASE/rcon/command'" \
        "200"
}

test_restart_endpoint() {
    local restart_payload='{"profile": "vehicles", "map_name": "Strike_at_Karkand", "server_name": "Test Server"}'
    
    run_test "Server Restart Request" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' -H 'Content-Type: application/json' -d '$restart_payload' '$API_BASE/restart'" \
        "200"
}

test_config_upload() {
    # Create a test config file
    echo "# Test configuration file" > "$TEMP_DIR/test.cfg"
    echo "sv_hostname \"Test Server\"" >> "$TEMP_DIR/test.cfg"
    
    run_test "Config File Upload" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' -F 'file=@$TEMP_DIR/test.cfg' '$API_BASE/configs/upload'" \
        "200"
}

test_config_upload_invalid_extension() {
    # Create a test file with invalid extension
    echo "malicious content" > "$TEMP_DIR/test.txt"
    
    run_test "Config Upload Invalid Extension (Should Fail)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' -F 'file=@$TEMP_DIR/test.txt' '$API_BASE/configs/upload'" \
        "400"
}

test_rate_limiting() {
    log_info "Testing rate limiting (sending 15 rapid requests)..."
    
    local failed_requests=0
    for i in {1..15}; do
        status_code=$(curl -s -w '%{http_code}' -o /dev/null -H "Authorization: Bearer $API_TOKEN" "$API_BASE/health")
        if [[ "$status_code" == "429" ]]; then
            failed_requests=$((failed_requests + 1))
        fi
        sleep 0.1
    done
    
    if [[ $failed_requests -gt 0 ]]; then
        log_info "✅ Rate limiting working - $failed_requests requests were rate limited"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_warn "⚠️  Rate limiting may not be working - no requests were blocked"
    fi
    
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_nonexistent_endpoint() {
    run_test "Non-existent Endpoint (Should Return 404)" \
        "curl -s -w 'HTTP/%{http_version} %{http_code}\n' -H 'Authorization: Bearer $API_TOKEN' '$API_BASE/nonexistent'" \
        "404"
}

# Main test execution
main() {
    echo "=== BF2 API Test Suite ==="
    echo "API Base URL: $API_BASE"
    echo "Testing with token: ${API_TOKEN:0:10}..."
    echo "Temporary directory: $TEMP_DIR"
    echo ""
    
    # Check if API is running
    if ! curl -s "$API_BASE/health" >/dev/null 2>&1; then
        log_error "API server is not running at $API_BASE"
        log_error "Please start the server before running tests"
        exit 1
    fi
    
    log_info "API server is responding, starting tests..."
    
    # Run all tests
    test_health_endpoint
    test_health_with_auth
    test_status_no_auth
    test_status_invalid_auth
    test_status_valid_auth
    test_status_x_api_token
    test_rcon_users
    test_rcon_custom_command
    test_config_upload
    test_config_upload_invalid_extension
    test_nonexistent_endpoint
    test_rate_limiting
    
    # Optional: Test restart endpoint (commented out by default as it actually restarts the server)
    # log_warn "Skipping restart test (would actually restart the BF2 server)"
    # test_restart_endpoint
    
    # Clean up
    rm -rf "$TEMP_DIR"
    
    # Summary
    echo ""
    echo "=== Test Summary ==="
    echo "Tests Run: $TESTS_RUN"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        log_info "🎉 All tests passed!"
        exit 0
    else
        log_error "❌ $TESTS_FAILED test(s) failed"
        exit 1
    fi
}

# Check command line arguments
if [[ $# -gt 0 ]]; then
    case "$1" in
        --api-url)
            API_BASE="$2"
            shift 2
            ;;
        --token)
            API_TOKEN="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--api-url URL] [--token TOKEN]"
            echo "Default API URL: $API_BASE"
            echo "Default token: read from config or set via --token"
            exit 0
            ;;
    esac
fi

# Run main function
main "$@"