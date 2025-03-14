#!/bin/bash

# This script tests the following AXUM endpoints:
# let app = Router::new()
#     .route("/", get(root))
#     .route("/version", get(version))
#     .route("/network", get(network))
#     .route("/status", get(status))
#     .route("/tokens", get(tokens))
#     .route("/pairs", get(pairs))
#     .route("/components", get(components))
#     .route("/pool/{id}", get(pool))
#     // .route("/pair/{", get(pair/{))
#     .layer(Extension(n.clone()))
#     .layer(Extension(shared.clone())); // Shared state

# async fn root() -> impl IntoResponse {
# async fn version() -> impl IntoResponse {
# async fn network(Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn status(Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn tokens(Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn pairs(Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn components(Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn pool(Extension(network): Extension<Network>, Path(id): Path<String>) -> impl IntoResponse {
# async fn simulate(Extension(shtss): Extension<SharedTychoStreamState>, Extension(network): Extension<Network>) -> impl IntoResponse {
# async fn pair(Extension(shtss): Extension<SharedTychoStreamState>, Extension(network): Extension<Network>, Query(params): Query<PairQuery>) -> impl IntoResponse {

set -e

# Set the API host.
# When running inside the Docker network, you can override API_HOST (e.g., API_HOST=ethereum)

# ===> API_HOST=ethereum ; sh tests/api.curl.sh

API_HOST=${API_HOST:-127.0.0.1}
LOG=${LOG:-false}
PORT=42001
API_URL="http://$API_HOST:$PORT"

echo "Testing API at $API_URL"

# Function to test an endpoint.
# Arguments:
#   $1 - Description (for logging)
#   $2 - Full URL to test

try() {
    local description="$1"
    local url="$2"
    echo "Testing $description"
    if [ "$LOG" = "true" ]; then
        curl -s "$url" | jq .
    else
        status=$(curl -o /dev/null -s -w "%{http_code}" "$url")
        if [ "$status" -eq 200 ]; then
            echo "Status: 200 OK"
        else
            echo "Status: $status (Error)"
        fi
    fi
    echo "\n-----------------------------\n"
}

# try "GET /" "$API_URL/"
# try "GET /version" "$API_URL/version"
# try "GET /network" "$API_URL/network"
# try "GET /status" "$API_URL/status"
# try "GET /tokens" "$API_URL/tokens"
# try "GET /pairs" "$API_URL/pairs"
# try "GET /components" "$API_URL/components"
# try "GET /pool/:id" "$API_URL/pool/0x7bea39867e4169dbe237d55c8242a8f2fcdcc387"
# try "GET /pair" "$API_URL/pair?tag=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
# try "GET /liquidity" "$API_URL/liquidity?tag=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

# MAINNET
# USDC-ETH
# try "GET /orderbook" "$API_URL/orderbook?tag=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
# ETH-WBTC
# try "GET /orderbook" "$API_URL/orderbook?tag=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

#
export eth="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
export usdc="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export wbtc="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
export dai="0x6b175474e89094c44da98b954eedeac495271d0f"
export usdt="0xdac17f958d2ee523a2206206994597c13d831ec7"

# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$usdt"
try "GET /orderbook" "$API_URL/orderbook?tag=$usdt-$wbtc"
# try "GET /orderbook" "$API_URL/orderbook?tag=$dai-$usdt"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$usdc"
