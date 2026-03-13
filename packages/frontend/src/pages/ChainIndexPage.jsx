import { useState, useEffect, useRef } from 'react';

const CHAINS = [
  { value: 'ethereum', label: 'ETH', icon: '⬡', color: '#60a5fa' },
  { value: 'solana',   label: 'SOL', icon: '◎', color: '#a78bfa' },
  { value: 'cosmos',   label: 'ATM', icon: '✦', color: '#34d399' },
  { value: 'aptos',    label: 'APT', icon: '◆', color: '#f59e0b' },
];

// Simulated events that trickle in for demo
const SIMULATED_EVENTS = [
  { type: 'token_transfer',  color: '#4ade80', title: 'Token Transfer',  meta: 'USDC · 1,200.00',   hash: '0x9e621f…8a9' },
  { type: 'native_transfer', color: '#60a5fa', title: 'Native Transfer', meta: 'ETH · 0.42',        hash: '0x5c504e…060' },
  { type: 'contract_call',   color: '#f59e0b', title: 'Contract Call',   meta: 'Uniswap V3 · swap', hash: '0xa9059c…49b' },
  { type: 'token_transfer',  color: '#4ade80', title: 'Token Transfer',  meta: 'WBTC · 0.005',      hash: '0x3fc821…cc2' },
  { type: 'native_transfer', color: '#60a5fa', title: 'Native Transfer', meta: 'SOL · 12.5',        hash: '5ZvGTs…JY4' },
  { type: 'contract_call',   color: '#f59e0b', title: 'Contract Call',   meta: 'Raydium · addLiq',  hash: '3pZdZD…8d' },
];

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}
function shortAddr(a) {
  if (!a || a.length <= 12) return a || '—';
  return `${a.slice(0,8)}…${a.slice(-6)}`;
}

export default function ChainIndexPage() {
  const [watchInput, setWatchInput]   = useState('');
  const [watchChain, setWatchChain]   = useState('ethereum');
  const [watched,    setWatched]      = useState([]);
  const [events,     setEvents]       = useState([]);
  const [isIndexing, setIsIndexing]   = useState(false);
  const intervalRef = useRef(null);
  const evtIdxRef   = useRef(0);

  // Start/stop the live indexing simulation
  useEffect(() => {
    if (isIndexing && watched.length > 0) {
      intervalRef.current = setInterval(() => {
        const tmpl  = SIMULATED_EVENTS[evtIdxRef.current % SIMULATED_EVENTS.length];
        const w     = watched[Math.floor(Math.random() * watched.length)];
        evtIdxRef.current++;
        const newEvt = {
          id:      Date.now(),
          time:    now(),
          wallet:  w.address,
          chain:   w.chain,
          ...tmpl,
        };
        setEvents(prev => [newEvt, ...prev].slice(0, 50));
        setWatched(prev => prev.map(p =>
          p.address === w.address ? { ...p, count: p.count + 1 } : p
        ));
      }, 2200);
    }
    return () => clearInterval(intervalRef.current);
  }, [isIndexing, watched.length]);

  const handleAddWatch = () => {
    const addr = watchInput.trim();
    if (!addr) return;
    if (watched.find(w => w.address === addr && w.chain === watchChain)) return;
    setWatched(prev => [...prev, { address: addr, chain: watchChain, count: 0 }]);
    setWatchInput('');
  };

  const handleUnwatch = (address, chain) => {
    setWatched(prev => prev.filter(w => !(w.address===address && w.chain===chain)));
  };

  const handleToggleIndex = () => {
    if (watched.length === 0) return;
    setIsIndexing(v => !v);
  };

  const totalEvents   = watched.reduce((s,w) => s + w.count, 0);
  const chainCounts   = watched.reduce((acc,w) => { acc[w.chain] = (acc[w.chain]||0)+1; return acc; }, {});

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Chain<span>Index</span></h1>
          <p className="page-sub">Watch wallets across chains · get real-time normalized events</p>
        </div>
        <button
          className={`watch-btn${isIndexing?' stop':''}`}
          style={{ height: 38, fontSize: 11 }}
          onClick={handleToggleIndex}
          disabled={watched.length === 0}
        >
          {isIndexing
            ? <><span className="live-dot" /> STOP INDEXING</>
            : <><span>⊛</span> START INDEXING</>}
        </button>
      </div>

      {/* Stats row */}
      <div className="index-stats-row" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <span className="stat-val">{watched.length}</span>
          <span className="stat-key">WATCHING</span>
        </div>
        <div className="stat-item">
          <span className="stat-val" style={{ color: isIndexing ? 'var(--green)' : 'var(--text3)' }}>
            {isIndexing ? 'LIVE' : 'IDLE'}
          </span>
          <span className="stat-key">STATUS</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{totalEvents}</span>
          <span className="stat-key">EVENTS CAUGHT</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{Object.keys(chainCounts).length || '—'}</span>
          <span className="stat-key">CHAINS</span>
        </div>
        <div className="stat-item">
          <span className="stat-val" style={{ color: 'var(--green)', fontSize: 10 }}>@chainmerge/sdk</span>
          <span className="stat-key">POWERED BY</span>
        </div>
      </div>

      <div className="index-layout">
        {/* Left: watch list */}
        <div className="index-panel">
          <div className="index-panel-title">// WATCHED WALLETS</div>

          {/* Add wallet */}
          <div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              {CHAINS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setWatchChain(c.value)}
                  style={{
                    padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font)',
                    fontWeight: 700, letterSpacing: '1px', borderRadius: 3, cursor: 'pointer',
                    background: watchChain===c.value
                      ? `color-mix(in srgb, ${c.color} 15%, transparent)`
                      : 'var(--bg3)',
                    border: `1px solid ${watchChain===c.value ? c.color : 'var(--border)'}`,
                    color: watchChain===c.value ? c.color : 'var(--text3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div className="watch-input-row">
              <input
                className="watch-input"
                placeholder="0x… wallet address"
                value={watchInput}
                onChange={e => setWatchInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleAddWatch()}
              />
              <button className="watch-btn" onClick={handleAddWatch} disabled={!watchInput.trim()}>
                WATCH +
              </button>
            </div>
          </div>

          {/* Demo quick-add */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:-4 }}>
            <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, alignSelf:'center' }}>DEMO:</span>
            {[
              { label:'Vitalik', chain:'ethereum', address:'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
              { label:'SOL Whale', chain:'solana', address:'SolDemoWallet111111111111111111111111111111' },
              { label:'Cosmos', chain:'cosmos', address:'cosmos1demo1234567890abcdef' },
            ].map(w => (
              <button key={w.address} className="demo-btn"
                onClick={() => {
                  if (!watched.find(x=>x.address===w.address)) {
                    setWatched(prev => [...prev, { address:w.address, chain:w.chain, count:0 }]);
                  }
                }}>
                {w.label}
              </button>
            ))}
          </div>

          {/* Watched list */}
          {watched.length === 0 ? (
            <div className="index-empty">
              <div className="index-empty-icon">⊛</div>
              <p>Add wallet addresses to watch</p>
            </div>
          ) : (
            <div className="watched-list">
              {watched.map(w => {
                const chainMeta = CHAINS.find(c=>c.value===w.chain);
                return (
                  <div key={`${w.chain}:${w.address}`} className="watched-item">
                    <span style={{ fontSize:13, color: chainMeta?.color||'var(--text3)', flexShrink:0 }}>
                      {chainMeta?.icon}
                    </span>
                    <span className="watched-addr" title={w.address}>{shortAddr(w.address)}</span>
                    <span className="watched-count">{w.count} events</span>
                    {isIndexing && (
                      <span className="watched-live">
                        <span className="live-dot" /> LIVE
                      </span>
                    )}
                    <button className="unwatch-btn" onClick={() => handleUnwatch(w.address, w.chain)}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SDK snippet */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:2, marginBottom:8 }}>// SDK USAGE</div>
            <div style={{
              background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:4, padding:'12px 14px', fontSize:11, lineHeight:1.8,
            }}>
              <span style={{color:'var(--purple)'}}>await</span>{' index.'}
              <span style={{color:'var(--blue)'}}>watchWallet</span>{'('}<br/>
              {'  '}<span style={{color:'var(--green)'}}>'{watchChain}'</span>{','}<br/>
              {'  '}<span style={{color:'var(--green)'}}>'{watchInput||'0x...'}'</span><br/>
              {')'}
            </div>
          </div>
        </div>

        {/* Right: event log */}
        <div className="index-panel">
          <div className="index-panel-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            // LIVE EVENT LOG
            {isIndexing && (
              <span className="watched-live" style={{ marginLeft:'auto' }}>
                <span className="live-dot" /> INDEXING
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="no-logs">
              <div className="no-logs-icon">◈</div>
              <p>
                {watched.length === 0
                  ? 'Add wallets to watch, then start indexing.'
                  : 'Press "START INDEXING" to begin catching events.'}
              </p>
            </div>
          ) : (
            <div className="event-log">
              {events.map(evt => (
                <div
                  key={evt.id}
                  className="log-entry"
                  style={{ '--log-color': evt.color }}
                >
                  <span className="log-time">{evt.time}</span>
                  <div className="log-body">
                    <span className="log-title">{evt.title}</span>
                    <span className="log-meta">
                      {evt.meta} · {CHAINS.find(c=>c.value===evt.chain)?.icon} {evt.chain}
                    </span>
                    <span className="log-hash">{evt.hash} · {shortAddr(evt.wallet)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What chainindex will do — roadmap callout */}
      <div style={{
        marginTop: 16,
        background:'rgba(0,229,160,0.03)', border:'1px solid rgba(0,229,160,0.1)',
        borderRadius:6, padding:'16px 20px',
        display:'flex', flexDirection:'column', gap:10,
      }}>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:2 }}>// CHAININDEX ROADMAP</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
          {[
            { icon:'◈', label:'watchWallet(chain, addr)', done:true },
            { icon:'⊛', label:'Real-time event streaming',done:true },
            { icon:'⬡', label:'Normalized event schema',  done:true },
            { icon:'⇄', label:'Cross-chain wallet view',  done:false },
            { icon:'📦', label:'Persistent event storage', done:false },
            { icon:'🔔', label:'Webhook notifications',    done:false },
          ].map(f => (
            <div key={f.label} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 12px', background:'var(--bg3)',
              border:'1px solid var(--border)', borderRadius:4, fontSize:11,
            }}>
              <span style={{ color: f.done?'var(--green)':'var(--text3)' }}>{f.done?'✓':f.icon}</span>
              <span style={{ color: f.done?'var(--text)':'var(--text3)' }}>{f.label}</span>
              {f.done && <span style={{ marginLeft:'auto', fontSize:9, color:'var(--green)', letterSpacing:1 }}>DONE</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}