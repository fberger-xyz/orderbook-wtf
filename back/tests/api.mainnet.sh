#!/bin/bash
# This script tests the Axum API endpoints:
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
# try "GET /components" "$API_URL/components"

# MAINNET
export eth="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
export usdc="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export wbtc="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
export dai="0x6b175474e89094c44da98b954eedeac495271d0f"
export usdt="0xdac17f958d2ee523a2206206994597c13d831ec7"

echo "$API_URL/orderbook?tag=$eth-$usdc&single=true&sp_input=$eth&sp_amount=100"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdc&single=true&sp_input=$eth&sp_amount=100"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdc&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$wbtc&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$wbtc&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$dai-$usdt&single=false&sp_input=0x&sp_amount=0"
