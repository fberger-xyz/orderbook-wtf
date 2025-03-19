#!/bin/bash

# Usage: export API_HOST=<API_HOST> && export LOG=true && ./tests/api.test.sh <network>

set -e

network=$1

if [ -z "$network" ]; then
    echo "Usage: $0 <network>"
    exit 1
fi

if [ "$network" = "ethereum" ]; then
    echo "Testing on Mainnet"
    PORT=42001
    export eth="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    export usdc="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    export wbtc="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
    export dai="0x6b175474e89094c44da98b954eedeac495271d0f"
    export usdt="0xdac17f958d2ee523a2206206994597c13d831ec7"
elif [ "$network" = "base" ]; then
    echo "Testing on Base"
    PORT=42003
    export eth="0x4200000000000000000000000000000000000006"
    export usdc="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
    export wbtc="0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"
    export dai="0x50c5725949a6f0c72e6c4a641f24049a917db0cb"
    export usdt="0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"
else
    echo "Invalid network: $network"
    exit 1
fi

API_HOST=${API_HOST:-127.0.0.1}
LOG=${LOG:-false}
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
    echo "--- --- --- --- ---"
}

try "GET /" "$API_URL/"
try "GET /version" "$API_URL/version"
try "GET /network" "$API_URL/network"
try "GET /status" "$API_URL/status"
try "GET /tokens" "$API_URL/tokens"
try "GET /components" "$API_URL/components"

try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdc&single=true&sp_input=$eth&sp_amount=100"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdc&single=false&sp_input=0x&sp_amount=0"
try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$wbtc&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$eth-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$wbtc&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$usdc-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$dai&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$wbtc-$usdt&single=false&sp_input=0x&sp_amount=0"
# try "GET /orderbook" "$API_URL/orderbook?tag=$dai-$usdt&single=false&sp_input=0x&sp_amount=0"
