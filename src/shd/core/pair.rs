use crate::shd::{
    data::fmt::SrzProtocolComponent,
    types::{Network, PairQuery},
};

pub async fn prepare(network: Network, components: Vec<SrzProtocolComponent>, params: PairQuery) {
    // for cp in pcps.clone() {
    //     match _pool(network.clone(), cp.id.clone()).await {
    //         Json(pool) => {
    //             // 'got' can be SrzUniswapV2State, SrzUniswapV3State, SrzUniswapV4State, SrzEVMPoolState
    //             match cp.protocol_type_name.as_str() {
    //                 "UniswapV2" => {
    //                     let state: SrzUniswapV2State = serde_json::from_value(pool).expect("Failed to decode the pool response");
    //                 }
    //                 "UniswapV3" => {
    //                     let state: SrzUniswapV3State = serde_json::from_value(pool).expect("Failed to decode the pool response");
    //                 }
    //                 "UniswapV4" => {
    //                     let state: SrzUniswapV4State = serde_json::from_value(pool).expect("Failed to decode the pool response");
    //                 }
    //                 "Balancer" => {
    //                     let state: SrzEVMPoolState = serde_json::from_value(pool).expect("Failed to decode the pool response");
    //                 }
    //                 "Curve" => {
    //                     let state: SrzEVMPoolState = serde_json::from_value(pool).expect("Failed to decode the pool response");
    //                 }
    //                 _ => {}
    //             }
    //         }
    //         _ => {}
    //     }
    // }
}
