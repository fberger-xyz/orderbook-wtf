#!/bin/bash

# This script tests the following endpoints:
# - GET /           => "Hello, Tycho!"
# - GET /version    => API version (commit hash)
# - GET /network    => Network object and configuration
# - GET /status     => Network status + last block synced
# - GET /tokens     => All tokens of the network
# - GET /pairs      => All existing pairs (optionally filtered)
# - GET /component/:id  => Component for a given pool id
# - GET /state/:id      => State for a given pool id
# - GET /components/:pair  => All components for one pair

set -e

# Set the API host.
# When running inside the Docker network, you can override API_HOST (e.g., API_HOST=ethereum)

# ===> API_HOST=ethereum ./api.curl.sh

API_HOST=${API_HOST:-127.0.0.1}
PORT=42001
API_URL="http://$API_HOST:$PORT"

echo "Testing GET /"
curl -s "$API_URL/" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /version"
curl -s "$API_URL/version" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /network"
curl -s "$API_URL/network" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /status"
curl -s "$API_URL/status" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /tokens"
curl -s "$API_URL/tokens" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /pairs (without filter)"
curl -s "$API_URL/pairs" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /components"
curl -s "$API_URL/components" | jq .
echo -e "\n-----------------------------\n"

echo "Testing GET /pool/:id"
curl -s "$API_URL/pool/0x7bea39867e4169dbe237d55c8242a8f2fcdcc387" | jq .
echo -e "\n-----------------------------\n"
