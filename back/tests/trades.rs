use std::fs;
use tap2::shd;
use tap2::shd::types::PairSimulatedOrderbook;

#[test]
fn test_simulations() {
    shd::utils::misc::log::new("trades".to_string());
    let folder = "misc/data-front-v2";
    let files = fs::read_dir(folder).expect("Failed to read folder");
    for file in files {
        let file = file.expect("Failed to read file entry");
        let path = file.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let data_str = fs::read_to_string(&path).expect("Failed to read JSON file");
            let data: PairSimulatedOrderbook = serde_json::from_str(&data_str).expect("Failed to parse JSON");
            assert!(!data.trades0to1.is_empty(), "trades0to1 should not be empty in {:?}", path);
            assert!(!data.trades1to0.is_empty(), "trades1to0 should not be empty in {:?}", path);
            assert_eq!(data.trades0to1.len(), data.trades1to0.len(), "trades0to1 and trades1to0 should have the same length in {:?}", path);

            for trades in [&data.trades0to1, &data.trades1to0] {
                let mut last_input = 0.0;
                let mut last_output = 0.0;
                let mut last_ratio = f64::INFINITY;

                let mut ratio_violations = 0;
                for trade in trades.iter() {
                    assert!(trade.input > last_input, "Inputs should be strictly increasing in {:?}", path);
                    assert!(trade.output > last_output, "Outputs should be strictly increasing in {:?}", path);

                    let distribution_sum: f64 = trade.distribution.iter().sum();
                    assert!((99.0..=101.0).contains(&distribution_sum), "Distribution sum must be within 99-101 in {:?}, got {}", path, distribution_sum);

                    if trade.ratio > last_ratio {
                        let diff = trade.ratio - last_ratio;
                        let diff_percent = (diff / last_ratio) * 100.0;

                        log::info!(
                            "Warning: Ratio is not decreasing in {:?} at trade with input {:.4} | \t Last_ratio: {:.6}, current_ratio: {:.6}, diff: {:.6}, diff_percent: {:.}%",
                            path,
                            trade.input,
                            last_ratio,
                            trade.ratio,
                            diff,
                            diff_percent
                        );

                        ratio_violations += 1;
                    }

                    last_input = trade.input;
                    last_output = trade.output;
                    last_ratio = trade.ratio;
                }
                log::info!("Ratio violations: {} on {} trades", ratio_violations, trades.len());
            }
        }
        log::info!("File {:?} passed", path);
    }
}
