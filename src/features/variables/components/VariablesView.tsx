import './VariablesView.css'

const PLACEHOLDER_ROWS = [
  { name: 'purchase_value', type: 'datalayer', scope: 'event' },
  { name: 'page_url', type: 'url', scope: 'global' },
  { name: 'ga4_measurement_id', type: 'constant', scope: 'global' },
  { name: 'user_id_cookie', type: 'cookie', scope: 'global' },
]

export default function VariablesView() {
  return (
    <div className="placeholder-view">
      <header className="ph-header">
        <div>
          <h1 className="ph-title">Variables</h1>
          <p className="ph-sub">Data layer variables and constants</p>
        </div>
        <span className="ph-badge">Coming soon</span>
      </header>

      <div className="ph-table">
        <div className="ph-table-head vars-head">
          <span>Name</span>
          <span>Type</span>
          <span>Scope</span>
          <span>Value</span>
        </div>
        {PLACEHOLDER_ROWS.map(row => (
          <div key={row.name} className="ph-table-row vars-row">
            <span className="ph-row-name ph-mono">{row.name}</span>
            <span className="ph-row-type">{row.type}</span>
            <span className="ph-row-scope">{row.scope}</span>
            <span className="ph-row-val">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
