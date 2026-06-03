import './TriggersView.css'

const PLACEHOLDER_ROWS = [
  { name: 'All Pages', type: 'pageview' },
  { name: 'CTA Button Click', type: 'click' },
  { name: 'Lead Form Submit', type: 'form_submit' },
  { name: 'Scroll 50%', type: 'scroll' },
  { name: 'Purchase Complete', type: 'custom_event' },
]

export default function TriggersView() {
  return (
    <div className="placeholder-view">
      <header className="ph-header">
        <div>
          <h1 className="ph-title">Triggers</h1>
          <p className="ph-sub">Conditions that fire your tags</p>
        </div>
        <span className="ph-badge">Coming soon</span>
      </header>

      <div className="ph-table">
        <div className="ph-table-head">
          <span>Name</span>
          <span>Type</span>
          <span>Tags fired</span>
        </div>
        {PLACEHOLDER_ROWS.map(row => (
          <div key={row.name} className="ph-table-row">
            <span className="ph-row-name">{row.name}</span>
            <span className="ph-row-type">{row.type}</span>
            <span className="ph-row-count">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
