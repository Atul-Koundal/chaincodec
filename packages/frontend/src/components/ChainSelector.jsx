const CHAINS = [
  { value: "ethereum", label: "Ethereum", icon: "⬡", color: "#627EEA" },
  { value: "solana",   label: "Solana",   icon: "◎", color: "#9945FF" },
];

export default function ChainSelector({ chain, onChange }) {
  return (
    <div className="chain-selector">
      {CHAINS.map((c) => (
        <button
          key={c.value}
          className={`chain-option ${chain === c.value ? "active" : ""}`}
          style={{ "--chain-color": c.color }}
          onClick={() => onChange(c.value)}
        >
          <span className="chain-icon">{c.icon}</span>
          <span className="chain-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}