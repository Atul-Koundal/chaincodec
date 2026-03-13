import { useState, useEffect } from 'react';

// ─── Chain metadata ───────────────────────────────────────────
const CHAIN_META = {
  ethereum: { label: 'ETH',   icon: '⬡', color: '#60a5fa' },
  solana:   { label: 'SOL',   icon: '◎', color: '#a78bfa' },
  cosmos:   { label: 'COSMOS',icon: '✦', color: '#34d399' },
  aptos:    { label: 'APT',   icon: '◆', color: '#f59e0b' },
  sui:      { label: 'SUI',   icon: '◉', color: '#38bdf8' },
  polkadot: { label: 'DOT',   icon: '⬤', color: '#e879f9' },
  bitcoin:  { label: 'BTC',   icon: '₿', color: '#fbbf24' },
  starknet: { label: 'STRK',  icon: '★', color: '#fb923c' },
};

const DEMO_WALLETS = [
  { label: 'Vitalik.eth', chain: 'ethereum', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { label: 'SOL Whale',   chain: 'solana',   address: 'SolDemoWallet111111111111111111111111111111' },
  { label: 'Cosmos Hub',  chain: 'cosmos',   address: 'cosmos1demo1234567890abcdef' },
  { label: 'Aptos',       chain: 'aptos',    address: '0xaptdemo1234567890abcdef1234567890abcdef12' },
];

const DEMO_TX_HASHES = {
  ethereum: { '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': ['0x9e621f6080ff42ab706d6a5adcdd08fadbc6ed25bf78b26757bddc2cc1d6a8a9','0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060'], default: ['0xa9059cbb2ab09eb219583f4a59a5d0623ade346d962bcd4e46b11da047c9049b'] },
  solana:   { default: ['5ZvGTsHXtMaGGpJeUUqQcGi6ZvEVcxH7vZoKFbnDuJY4q8Kz3rMpN2wXsY1tRb6','3pZdZDUAaF7a3RJfFdQUMEBRVJeUUqQcGi6ZvEVcxH7vZoK3nMqP5wXtY2uSb8d'] },
  cosmos:   { default: ['A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2'] },
  aptos:    { default: ['0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2','0xb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'] },
};

function getTxHashes(chain, address) {
  const d = DEMO_TX_HASHES[chain] || {};
  return d[address] || d[address?.toLowerCase()] || d['default'] || [];
}

const DEMO_CHAINS = ['ethereum', 'solana', 'cosmos', 'aptos'];

const EVENT_META = {
  token_transfer:  { icon: '💸', color: '#4ade80' },
  native_transfer: { icon: '⟡',  color: '#60a5fa' },
  contract_call:   { icon: '📜', color: '#f59e0b' },
  swap:            { icon: '⇄',  color: '#a78bfa' },
  unknown:         { icon: '◈',  color: '#6b8099' },
};

function shortAddr(a) {
  if (!a) return '—';
  if (a.length <= 12) return a;
  return `${a.slice(0,6)}…${a.slice(-4)}`;
}
function timeAgo(ts) {
  if (!ts) return '';
  const d = Math.floor(Date.now()/1000) - Number(ts);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
function formatAmt(amount, decimals=18, symbol='') {
  if (!amount || amount==='0') return null;
  try {
    const raw = BigInt(amount);
    const div = BigInt(10**Math.min(decimals,18));
    const w = raw/div, f = raw%div;
    const fs = f.toString().padStart(decimals,'0').slice(0,4).replace(/0+$/,'');
    return `${w.toLocaleString()}${fs?'.'+fs:''} ${symbol}`.trim();
  } catch { return `${amount} ${symbol}`.trim(); }
}

function ChainBadge({ chain }) {
  const m = CHAIN_META[chain?.toLowerCase()] || { label: chain?.toUpperCase()||'?', icon:'◈', color:'#6b8099' };
  return (
    <span className="chain-badge" style={{ '--badge-color': m.color }}>
      {m.icon} {m.label}
    </span>
  );
}

function ActivityCard({ tx, walletAddress }) {
  const primary = tx.events?.find(e=>e.type==='token_transfer') || tx.events?.find(e=>e.type==='native_transfer') || tx.events?.[0];
  if (!primary) return null;
  const meta = EVENT_META[primary.type] || EVENT_META.unknown;
  const isSender = walletAddress && tx.sender?.toLowerCase()===walletAddress.toLowerCase();
  let amountStr = null;
  if (primary.type==='token_transfer')  amountStr = formatAmt(primary.amount, primary.token?.decimals??18, primary.token?.symbol);
  if (primary.type==='native_transfer') amountStr = formatAmt(primary.amount, ['SOL','ATOM','APT'].includes(primary.symbol)?9:18, primary.symbol);
  return (
    <div className="activity-card" style={{ '--event-color': meta.color }}>
      <div className="card-left"><span className="event-icon">{meta.icon}</span></div>
      <div className="card-body">
        <div className="card-top">
          <ChainBadge chain={tx.chain} />
          <span className="direction-badge" style={{ color: isSender?'#f87171':'#4ade80' }}>
            {isSender?'SENT':'RECEIVED'}
          </span>
          {amountStr && <span className="amount-str">{amountStr}</span>}
          {!amountStr && <span className="token-name">{primary.type?.replace('_',' ')}</span>}
          {tx.timestamp && <span className="time-ago">{timeAgo(tx.timestamp)}</span>}
        </div>
        <div className="transfer-flow">
          <span className="from-addr">{shortAddr(primary.from||tx.sender)}</span>
          <span className="flow-arrow">→</span>
          <span className="to-addr">{shortAddr(primary.to||tx.receiver)}</span>
        </div>
        <div className="card-bottom">
          <span className="tx-hash">{shortAddr(tx.tx_hash)}</span>
          {tx.events?.length>1 && <span>+{tx.events.length-1} more</span>}
          <span className={`status-${tx.status}`} style={{marginLeft:'auto'}}>
            {tx.status==='success'?'✓ success':tx.status==='failed'?'✗ failed':'⏳ pending'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChainViewPage() {
  const [address,    setAddress]    = useState('');
  const [chain,      setChain]      = useState('ethereum');
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [tracked,    setTracked]    = useState(false);
  const [cycleIdx,   setCycleIdx]   = useState(0);

  const isIdle = !tracked && !loading && !error;
  useEffect(() => {
    if (!isIdle) return;
    const id = setInterval(() => setCycleIdx(i => (i+1) % DEMO_CHAINS.length), 2000);
    return () => clearInterval(id);
  }, [isIdle]);

  const handleTrack = async () => {
    if (!address.trim()) return;
    setLoading(true); setError(null); setActivities([]); setTracked(false);
    try {
      const hashes = getTxHashes(chain, address.trim());
      if (!hashes.length) { setError(`No transactions found for this wallet on ${chain}.`); return; }
      const settled = await Promise.allSettled(
        hashes.map(h => fetch(`/api/decode?chain=${chain}&hash=${encodeURIComponent(h)}`).then(r=>r.json()))
      );
      const results = settled.filter(r=>r.status==='fulfilled'&&!r.value?.error).map(r=>r.value);
      if (!results.length) { setError('Could not decode transactions. Is ChainMerge running on :3000?'); return; }
      setActivities(results); setTracked(true);
    } catch(e) { setError(`Network error: ${e.message}`); }
    finally    { setLoading(false); }
  };

  const successCount   = activities.filter(a=>a.status==='success').length;
  const transferCount  = activities.filter(a=>a.events?.some(e=>e.type==='token_transfer'||e.type==='native_transfer')).length;
  const uniqueChains   = [...new Set(activities.map(a=>a.chain))];

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Chain<span>View</span></h1>
          <p className="page-sub">Multichain wallet activity feed · powered by @chainmerge/sdk</p>
        </div>
      </div>

      {/* Wallet input */}
      <div className="wallet-input-card" style={{ marginBottom: 14 }}>
        <div className="wallet-input-label">// TRACK WALLET</div>
        <div className="wallet-input-row">
          <select className="chain-select" value={chain} onChange={e=>setChain(e.target.value)} disabled={loading}>
            <optgroup label="── LIVE ──">
              <option value="ethereum">⬡  Ethereum</option>
              <option value="solana">◎  Solana</option>
              <option value="cosmos">✦  Cosmos</option>
              <option value="aptos">◆  Aptos</option>
            </optgroup>
            <optgroup label="── SIMULATED ──">
              <option value="sui">◉  Sui</option>
              <option value="polkadot">⬤  Polkadot</option>
              <option value="bitcoin">₿  Bitcoin</option>
              <option value="starknet">★  StarkNet</option>
            </optgroup>
          </select>
          <div className="address-wrap">
            <span className="address-prefix">WALLET//</span>
            <input className="address-input" value={address} onChange={e=>setAddress(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!loading&&address.trim()&&handleTrack()}
              placeholder="0x… or any wallet address" spellCheck={false} disabled={loading} />
            {address && <button className="address-clear" onClick={()=>setAddress('')}>×</button>}
          </div>
          <button className={`track-btn${loading?' loading':''}`} onClick={handleTrack} disabled={loading||!address.trim()}>
            {loading ? <><span className="spinner" /> DECODING…</> : 'TRACK →'}
          </button>
        </div>
        <div className="demo-wallets">
          <span className="demo-label">DEMO:</span>
          {DEMO_WALLETS.map(w => (
            <button key={w.address} className="demo-btn" disabled={loading}
              onClick={() => { setChain(w.chain); setAddress(w.address); }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cycling code callout */}
      {isIdle && (
        <div className="demo-callout" style={{ marginBottom: 14 }}>
          <div className="callout-header">
            <span className="callout-title">// How ChainView uses ChainMerge</span>
            <span className="callout-sub">ONE line per chain. Same schema every time.</span>
          </div>
          <div className="callout-code">
            {DEMO_CHAINS.map((c,i) => (
              <div key={c} className={`code-line-row${i===cycleIdx?' active':''}`}>
                <span className="code-kw">const</span>{' result = '}
                <span className="code-fn">decode</span>{'('}
                <span className="code-str">'{c}'</span>{', txHash)'}
                {i===cycleIdx && <span className="code-cursor"> ▌</span>}
              </div>
            ))}
            <div className="code-output-hint">{'// ↳ { chain, tx_hash, status, sender, receiver, events[] }'}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom: 14 }}>
          <span className="error-icon">✗</span>
          <div><div className="error-title">Error</div><div className="error-msg">{error}</div></div>
        </div>
      )}

      {/* Feed */}
      {loading && (
        <div className="feed-loading">
          <div className="feed-loading-bars">
            {[...Array(7)].map((_,i) => <div key={i} className="feed-bar" style={{animationDelay:`${i*0.12}s`}} />)}
          </div>
          <p>Decoding transactions via ChainMerge…</p>
          <span className="powered-by">⬡ @chainmerge/sdk</span>
        </div>
      )}

      {!loading && tracked && activities.length > 0 && (
        <div className="feed-container">
          <div className="feed-stats">
            <div className="stat"><span className="stat-val">{activities.length}</span><span className="stat-key">TRANSACTIONS</span></div>
            <div className="stat"><span className="stat-val" style={{color:'#4ade80'}}>{successCount}</span><span className="stat-key">SUCCESSFUL</span></div>
            <div className="stat"><span className="stat-val">{transferCount}</span><span className="stat-key">TRANSFERS</span></div>
            <div className="stat">
              <span className="stat-val">
                {uniqueChains.map((c,i) => (
                  <span key={c} style={{color: CHAIN_META[c]?.color||'#c9d9e8'}}>
                    {c.slice(0,3).toUpperCase()}{i<uniqueChains.length-1?' · ':''}
                  </span>
                ))}
              </span>
              <span className="stat-key">CHAINS</span>
            </div>
            <div className="stat powered"><span className="stat-val sdk-badge">@chainmerge/sdk</span><span className="stat-key">POWERED BY</span></div>
          </div>
          <div className="feed-list">
            {activities.map((tx,i) => <ActivityCard key={`${tx.tx_hash}-${i}`} tx={tx} walletAddress={address} />)}
          </div>
        </div>
      )}

      {!loading && !tracked && !error && activities.length === 0 && (
        <div className="feed-empty">
          <div className="empty-icon">◈</div>
          <p>Enter a wallet address above or try a demo wallet.</p>
          <span>Supports ETH, SOL, COSMOS, APT and more.</span>
        </div>
      )}
    </>
  );
}