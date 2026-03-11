pub mod ethereum;
pub mod solana;

use crate::models::NormalizedTransaction;
use anyhow::Result;
use async_trait::async_trait;

/// Every chain decoder must implement this trait.
#[async_trait]
pub trait Decoder: Send + Sync {
    fn chain_name(&self) -> &'static str;
    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction>;
}

/// Factory: returns the right decoder for a given chain string
pub fn get_decoder(chain: &str) -> Option<Box<dyn Decoder>> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "eth" | "evm" => Some(Box::new(ethereum::EthereumDecoder)),
        "solana" | "sol" => Some(Box::new(solana::SolanaDecoder)),
        _ => None,
    }
}