#!/bin/bash
set -e
API_HOST=${API_HOST:-127.0.0.1}
LOG=${LOG:-false}
PORT=42002
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

try "GET /" "$API_URL/"
try "GET /version" "$API_URL/version"
try "GET /network" "$API_URL/network"
try "GET /status" "$API_URL/status"
try "GET /tokens" "$API_URL/tokens"
# try "GET /pairs" "$API_URL/pairs"
try "GET /components" "$API_URL/components"
# try "GET /pool/:id" "$API_URL/pool/0x7bea39867e4169dbe237d55c8242a8f2fcdcc387"

# MAINNET
export eth="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
export usdc="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export wbtc="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
export dai="0x6b175474e89094c44da98b954eedeac495271d0f"
export usdt="0xdac17f958d2ee523a2206206994597c13d831ec7"

try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdc"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$wbtc"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$dai"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdt"
try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$wbtc"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$dai"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$usdt"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$dai"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$usdt"
# try "GET /orderbook" "$API_URL/orderbook?tag=$dai-$usdt"
