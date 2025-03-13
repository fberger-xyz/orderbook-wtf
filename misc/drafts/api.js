
async function fetchData() {
    const response = await fetch('https://your-api.com/v1/protocol_components', { // Remplace '/v1/protocol_components' par l'URL complète
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "chain": "ethereum",
            "component_ids": ["text"],
            "pagination": {
                "page": 1,
                "page_size": 1
            },
            "protocol_system": "text",
            "tvl_gt": 1
        })
    });

    const data = await response.json();
    console.log(data);
}

fetchData().catch(console.error);