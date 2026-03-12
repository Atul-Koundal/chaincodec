require('dotenv').config({ path: '../../.env' });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 3000;
const RUST_URL = `http://localhost:${process.env.RUST_SERVER_PORT || 3001}`;

app.use(cors());
app.use(express.json());

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const rustHealth = await axios.get(`${RUST_URL}/health`, { timeout: 3000 });
    res.json({
      api: 'ok',
      rust_engine: rustHealth.data,
    });
  } catch {
    res.status(503).json({
      api: 'ok',
      rust_engine: 'unavailable — is the Rust server running?',
    });
  }
});

// ─── Main decode endpoint ─────────────────────────────────────────────────────
// GET /api/decode?chain=ethereum&hash=0xabc...
app.get('/api/decode', async (req, res) => {
  const { chain, hash } = req.query;

  // Validate inputs
  if (!chain) {
    return res.status(400).json({ 
      error: 'Missing required parameter: chain', 
      code: 'MISSING_CHAIN' 
    });
  }
  if (!hash) {
    return res.status(400).json({ 
      error: 'Missing required parameter: hash', 
      code: 'MISSING_HASH' 
    });
  }

  const supportedChains = ['ethereum', 'solana', 'cosmos'];
  if (!supportedChains.includes(chain.toLowerCase())) {
    return res.status(400).json({
      error: `Unsupported chain: "${chain}". Supported: ${supportedChains.join(', ')}`,
      code: 'UNSUPPORTED_CHAIN',
    });
  }

  // Basic hash format validation
  if (chain === 'ethereum' && !hash.startsWith('0x')) {
    return res.status(400).json({
      error: 'Ethereum transaction hashes must start with 0x',
      code: 'INVALID_HASH_FORMAT',
    });
  }

  try {
    // Forward to Rust engine
    const rustResponse = await axios.get(`${RUST_URL}/decode`, {
      params: { chain: chain.toLowerCase(), hash },
      timeout: 30000,
    });

    return res.json(rustResponse.data);

  } catch (err) {
    // Rust engine returned a structured error
    if (err.response) {
      const { status, data } = err.response;
      return res.status(status).json(data);
    }

    // Rust engine is unreachable
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Rust engine is not running. Start it with: cd packages/core-rust && cargo run',
        code: 'ENGINE_UNAVAILABLE',
      });
    }

    // Timeout
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timed out. The RPC node may be slow — try again.',
        code: 'TIMEOUT',
      });
    }

    console.error('Unexpected error:', err.message);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ 
    error: `Route not found: ${req.url}`, 
    code: 'NOT_FOUND' 
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ChainCodec API   →  :${PORT}            ║
║   Rust Engine      →  :${process.env.RUST_SERVER_PORT || 3001}            ║
╚════════════════════════════════════════╝
  `);
});