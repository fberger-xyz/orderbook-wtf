use tycho_client::rpc::HttpRPCClient;
use tycho_client::rpc::RPCClient;
use tycho_client::{feed::component_tracker::ComponentFilter, stream::TychoStreamBuilder};
use tycho_core::dto::Chain;

#[tokio::main]
async fn main() {
    println!("Hello Tycho");

    match HttpRPCClient::new("https://tycho-beta.propellerheads.xyz", Some("sampletoken")) {
        Ok(client) => {
            println!("Client created successfully");

            match client
                .get_all_tokens(
                    Chain::Ethereum,
                    Some(51_i32), // min token quality to filter for certain token types
                    Some(30_u64), // number of days since last traded
                    10,           // pagination chunk size
                )
                .await
            {
                Ok(tokens) => {
                    println!("Received {} tokens", tokens.len());
                    for token in tokens {
                        println!("Token: {:?}", token);
                    }
                }

                Err(e) => {
                    println!("Failed to get tokens: {:?}", e);
                }
            }
        }
        Err(e) => {
            println!("Failed to create client: {:?}", e);
            return;
        }
    }
}

// Token quality is between 0-100, where:
//  - 100: Normal token
//  - 75: Rebase token
//  - 50: Fee token
//  - 10: Token analysis failed at creation
//  - 5: Token analysis failed on cronjob (after creation).
//  - 0: Failed to extract decimals onchain
