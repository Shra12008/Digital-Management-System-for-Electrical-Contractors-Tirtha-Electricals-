import React, { useId, useState } from "react";
import { formatCompact, niceScale } from "../../utils/financeUtils";
import { formatINR } from "../../utils/invoiceUtils";

const W = 640;
const H = 260;
const ML = 60;
const MR = 20;
const MT = 16;
const MB = 34;

/** Single-series area/line chart. points: [{ label, value }] */
export default function AreaChart({ points, color = "#60a5fa", valueLabel = "Balance" }) {
  const [hover, setHover] = useState(null);
  const gid = `fin-area-${useId().replace(/:/g, "")}`;
  if (points.every((p) => !p.value)) return <p className="fin-empty">No completed transactions in the last 6 months yet. Add one to see this chart.</p>;
  const vals = points.map((p) => p.value);
  const { lo, hi, ticks } = niceScale(Math.min(...vals, 0), Math.max(...vals, 0));
  const innerW = W - ML - MR;
  const innerH = H - MT - MB;
  const x = (i) => ML + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const y = (v) => MT + ((hi - v) / (hi - lo)) * innerH;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const h = hover !== null ? points[hover] : null;
  const step = innerW / Math.max(points.length - 1, 1);

  return (
    <div className="fin-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${valueLabel} trend`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.38" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} className={t === 0 ? "fin-zero-line" : "fin-grid-line"} />
            <text x={ML - 10} y={y(t) + 4} textAnchor="end" className="fin-axis-text">{formatCompact(t)}</text>
          </g>
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : 4} stroke={color} strokeWidth="2.5" style={{ fill: "var(--bg-surface)" }} />
            <text x={x(i)} y={H - 10} textAnchor="middle" className="fin-axis-text">{p.label}</text>
            <rect x={x(i) - step / 2} y={MT} width={step} height={innerH + MB} fill="transparent" tabIndex={0}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              aria-label={`${p.label}: ${formatINR(p.value)}`} />
          </g>
        ))}
      </svg>
      {h && (
        <div className="fin-tooltip" style={{ left: `${Math.min(Math.max((x(hover) / W) * 100, 14), 86)}%` }}>
          <strong>{h.label}</strong>
          <span><i style={{ background: color }} />{valueLabel} <b className={h.value < 0 ? "neg" : ""}>{formatINR(h.value)}</b></span>
        </div>
      )}
    </div>
  );
}
