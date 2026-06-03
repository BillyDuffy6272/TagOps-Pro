import './ConversionsView.css'

const PLACEHOLDER_ROWS = [
  { name: 'purchase', display: 'Purchase', active: true },
  { name: 'generate_lead', display: 'Generate Lead', active: true },
  { name: 'view_pricing', display: 'View Pricing', active: false },
]

export default function ConversionsView() {
  return (
    <div className="placeholder-view">
      <header className="ph-header">
        <div>
          <h1 className="ph-title">Conversions</h1>
          <p className="ph-sub">GA4 conversion events</p>
        </div>
        <span className="ph-badge">Coming soon</span>
      </header>

      <div className="ph-table">
        <div className="ph-table-head conv-head">
          <span>Event name</span>
          <span>Display name</span>
          <span>Status</span>
          <span>Verified</span>
        </div>
        {PLACEHOLDER_ROWS.map(row => (
          <div key={row.name} className="ph-table-row conv-row">
            <span className="ph-row-event">{row.name}</span>
            <span className="ph-row-display">{row.display}</span>
            <span className={`ph-row-status ${row.active ? 'status-active' : 'status-paused'}`}>
              {row.active ? 'Active' : 'Inactive'}
            </span>
            <span className="ph-row-verified">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
