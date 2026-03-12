import { useState } from "react";
import ChainSelector from "./components/ChainSelector";
import HashInput from "./components/HashInput";
import OutputViewer from "./components/OutputViewer";
import "./index.css";

const SAMPLE_TRANSACTIONS = {
  ethereum: [
    {
      label: "Multi Transfer",
      hash: "0x9e621f6080ff42ab706d6a5adcdd08fadbc6ed25bf78b26757bddc2cc1d6a8a9"
    },
  ],
  solana: [
    {
      label: "SOL Transfer",
      hash: "5ZvGTsHXtMaGGpJeUUqQcGi6ZvEVcxH7vZoKFbnDuJYFtCaKDeSKmAg2qB1CZcK"
    },
  ],
};

export default function App() {
  const [chain, setChain] = useState("ethereum");
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decoded, setDecoded] = useState(false);

  const handleDecode = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDecoded(false);

    try {
      const res = await fetch(
        `/api/decode?chain=${chain}&hash=${encodeURIComponent(hash.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data);
        setDecoded(true);
      }
    } catch (e) {
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSample = (sample) => {
    setHash(sample.hash);
    setResult(null);
    setError(null);
    setDecoded(false);
  };

  return (
    <div className="app">
      <div className="grid-bg" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-group">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">
              Chain<span className="logo-accent">Codec</span>
            </span>
            <span className="logo-badge">LITE</span>
          </div>
          <p className="tagline">Universal Multichain Transaction Decoder</p>
        </div>
        <div className="chain-pills">
          <span className="pill pill-eth">ETH</span>
          <span className="pill-sep">+</span>
          <span className="pill pill-sol">SOL</span>
        </div>
      </header>

      {/* Main panel */}
      <main className="main">
        <div className="decoder-card">
          <div className="card-label">// DECODE TRANSACTION</div>

          <div className="input-row">
            <ChainSelector
              chain={chain}
              onChange={(c) => {
                setChain(c);
                setHash("");
                setResult(null);
                setError(null);
              }}
            />
            <HashInput
              hash={hash}
              onChange={setHash}
              onSubmit={handleDecode}
              loading={loading}
            />
            <button
              className={`decode-btn ${loading ? "loading" : ""} ${decoded ? "success" : ""}`}
              onClick={handleDecode}
              disabled={loading || !hash.trim()}
            >
              {loading ? (
                <span className="spinner" />
              ) : decoded ? (
                "✓ DECODED"
              ) : (
                "DECODE →"
              )}
            </button>
          </div>

          {/* Sample transactions */}
          <div className="samples">
            <span className="samples-label">Try sample:</span>
            {SAMPLE_TRANSACTIONS[chain]?.map((s) => (
              <button
                key={s.hash}
                className="sample-btn"
                onClick={() => handleSample(s)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output area */}
        <div className={`output-area ${result ? "has-result" : ""} ${error ? "has-error" : ""}`}>
          {!result && !error && !loading && (
            <div className="placeholder">
              <div className="placeholder-icon">◈</div>
              <p>
                Enter a transaction hash above to decode it into
                <br />a unified, chain-agnostic JSON format.
              </p>
              <div className="placeholder-chains">
                <span>ethereum://Transfer(address,address,uint256)</span>
                <span className="arrow">↓</span>
                <span className="unified">
                  {'{ type: "token_transfer", from, to, amount }'}
                </span>
                <span>solana://SPL.TransferChecked</span>
                <span className="arrow">↓</span>
                <span className="unified">
                  {'{ type: "token_transfer", from, to, amount }'}
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-bars">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p>Fetching from {chain} RPC and decoding...</p>
            </div>
          )}

          {error && (
            <div className="error-box">
              <span className="error-icon">✗</span>
              <div>
                <div className="error-title">Decode Failed</div>
                <div className="error-msg">{error}</div>
              </div>
            </div>
          )}

          {result && <OutputViewer data={result} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>ChainCodec Lite v0.1.0</span>
        <span className="sep">·</span>
        <span>Rust + Node.js + React</span>
        <span className="sep">·</span>
        <span>Hackathon Edition</span>
      </footer>
    </div>
  );
}