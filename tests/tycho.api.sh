curl 'https://docs.propellerheads.xyz/v1/protocol_state?protocol_system=uniswap_v3' \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "chain": "ethereum",
  "include_balances": true,
  "pagination": {
    "page": 1,
    "page_size": 1
  },
  "protocol_ids": [
    "0x3416cf6c708da44db2624d63ea0aaef7113527c6"
  ],
  "protocol_system": "uniswap_v3",
  "version": {
    "block": {
      "chain": "ethereum",
      "hash": "0xf3459604aeeda59fdbac8dea2170ee82b9aa74e05fbe0093fa1095a455bb902d",
      "number": "22037584"
    },
    "timestamp": 1741864411
  }
}'
