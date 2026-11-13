export default function CircuitDivider() {
  const path = 'M0,23 H260 L290,8 H520 L550,38 H860 L890,23 H1160'

  return (
    <div className="circuit-divider" aria-hidden="true">
      <svg viewBox="0 0 1160 46" preserveAspectRatio="none">
        <path className="trace" d={path} />
        <circle className="node" cx="290" cy="8" r="4" />
        <circle className="node" cx="550" cy="38" r="4" />
        <circle className="node" cx="890" cy="23" r="4" />
        <circle className="pulse" r="3.5" style={{ offsetPath: `path('${path}')` }} />
      </svg>
    </div>
  )
}
