use tycho_client::{feed::component_tracker::ComponentFilter, stream::TychoStreamBuilder};
use tycho_core::dto::Chain;

#[tokio::main]
async fn main() {
    println!("Hello Tycho");
    let (handle, mut receiver) = TychoStreamBuilder::new("tycho-beta.propellerheads.xyz", Chain::Ethereum)
        .auth_key(Some("sampletoken".into()))
        .exchange("uniswap_v2", ComponentFilter::with_tvl_range(10.0, 15.0))
        .exchange(
            "uniswap_v3",
            ComponentFilter::Ids(vec!["0xCBCdF9626bC03E24f779434178A73a0B4bad62eD".to_string(), "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640".to_string()]),
        )
        .build()
        .await
        .expect("Failed to build tycho stream");

    let mut t = chrono::Utc::now().timestamp_millis();

    while let Some(fm) = receiver.recv().await {
        let state_msgs = fm.state_msgs.len();
        let sync_states = fm.sync_states.len();
        println!("Received {} state messages and {} sync states", state_msgs, sync_states);
        match fm.state_msgs.get("uniswap_v2") {
            Some(msg) => {
                println!("uniswap_v2: First state message: {:?}", msg);
            }
            None => {
                println!("uniswap_v2: No state messages");
            }
        }
        let now = chrono::Utc::now().timestamp_millis();
        let elasped = now - t;
        t = now;
        println!("Elapsed time: {} ms", elasped);
    }
}
