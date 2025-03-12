fn get_amount_out(pool: usize, amount: u32) -> u32 {
    // Simule le calcul du montant en USDC obtenu en fonction du pool et de l'ETH apporté.
    // La formule utilisée est : output = reserve_out * amount / (reserve_in + amount)
    // On ignore les décimales.
    match pool {
        0 => {
            // Pool0 avec réserves : 50 ETH et 10 000 USDC
            println!("Pool0: Swapping {} ETH (reserves: 50 ETH, 10000 USDC)", amount);
            10000 * amount / (50 + amount)
        }
        1 => {
            // Pool1 avec réserves : 30 ETH et 7000 USDC
            println!("Pool1: Swapping {} ETH (reserves: 30 ETH, 7000 USDC)", amount);
            7000 * amount / (30 + amount)
        }
        2 => {
            // Pool2 avec réserves : 40 ETH et 9000 USDC
            println!("Pool2: Swapping {} ETH (reserves: 40 ETH, 9000 USDC)", amount);
            9000 * amount / (40 + amount)
        }
        _ => {
            println!("Pool inconnu");
            0
        }
    }
}

fn main() {
    let total_eth: u32 = 100;
    let mut best_allocation = (0, 0, 0);
    let mut best_usdc = 0;

    println!("Début de l'optimisation pour un swap de {} ETH sur 3 pools.", total_eth);

    // On parcourt toutes les répartitions possibles pour x, y et z tels que x + y + z = total_eth.
    for x in 0..=total_eth {
        for y in 0..=(total_eth - x) {
            let z = total_eth - x - y;
            println!("\nTest allocation -> Pool0: {} ETH, Pool1: {} ETH, Pool2: {} ETH", x, y, z);

            let usdc0 = get_amount_out(0, x);
            let usdc1 = get_amount_out(1, y);
            let usdc2 = get_amount_out(2, z);

            let total_usdc = usdc0 + usdc1 + usdc2;
            println!("Résultat -> Pool0: {} USDC, Pool1: {} USDC, Pool2: {} USDC => Total: {} USDC", usdc0, usdc1, usdc2, total_usdc);

            if total_usdc > best_usdc {
                best_usdc = total_usdc;
                best_allocation = (x, y, z);
                println!("Nouvelle allocation optimale trouvée: {:?} avec {} USDC", best_allocation, best_usdc);
            }
        }
    }

    println!("\nOptimisation terminée !");
    println!(
        "Meilleure allocation : Pool0: {} ETH, Pool1: {} ETH, Pool2: {} ETH => {} USDC obtenus",
        best_allocation.0, best_allocation.1, best_allocation.2, best_usdc
    );
}
