import React, { useState } from "react";
import { formatCompact, niceScale } from "../../utils/financeUtils";
import { formatINR } from "../../utils/invoiceUtils";

const W = 640;
const H = 300;
const ML = 60;
const MR = 16;
const MT = 16;
const MB = 34;

/**
 * Grouped income / expense bars per month with a net-profit line on top.
 * data: [{ label, income, expense, net }]
 */
export default function BarLineChart({ data }) {
  const [hover, setHover] = useState(null);
  if (data.every((d) => !d.income && !d.expense)) return <p className="fin-empty">No completed transactions in the last 6 months yet. Add one to see this chart.</p>;
  const values = data.flatMap((d) => [d.income, d.expense, d.net]);
  const { lo, hi, ticks } = niceScale(Math.min(...values, 0), Math.max(...values, 0));
  const innerW = W - ML - MR;
  const innerH = H - MT - MB;
  const y = (v) => MT + ((hi - v) / (hi - lo)) * innerH;
  const groupW = innerW / data.length;
  const barW = Math.min(26, groupW * 0.28);
  const cx = (i) => ML + groupW * (i + 0.5);
  const line = data.map((d, i) => `${cx(i)},${y(d.net)}`).join(" ");
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="fin-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly income, expenses and net profit">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} className={t === 0 ? "fin-zero-line" : "fin-grid-line"} />
            <text x={ML - 10} y={y(t) + 4} textAnchor="end" className="fin-axis-text">{formatCompact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.label} opacity={hover === null || hover === i ? 1 : 0.45}>
            <rect x={cx(i) - barW - 2} y={Math.min(y(d.income), y(0))} width={barW} height={Math.abs(y(0) - y(d.income))} rx="4" fill="#10b981" />
            <rect x={cx(i) + 2} y={Math.min(y(d.expense), y(0))} width={barW} height={Math.abs(y(0) - y(d.expense))} rx="4" fill="#f97316" />
            <text x={cx(i)} y={H - 10} textAnchor="middle" className="fin-axis-text">{d.label}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={d.label} cx={cx(i)} cy={y(d.net)} r={hover === i ? 5.5 : 4} stroke="#60a5fa" strokeWidth="2.5" style={{ fill: "var(--bg-surface)" }} />
        ))}
        {data.map((d, i) => (
          <rect key={`hit-${d.label}`} x={ML + groupW * i} y={MT} width={groupW} height={innerH + MB} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
            aria-label={`${d.label}: income ${formatINR(d.income)}, expenses ${formatINR(d.expense)}, net ${formatINR(d.net)}`} />
        ))}
      </svg>
      {h && (
        <div className="fin-tooltip" style={{ left: `${Math.min(Math.max((cx(hover) / W) * 100, 16), 84)}%` }}>
          <strong>{h.label}</strong>
          <span><i style={{ background: "#10b981" }} />Income <b>{formatINR(h.income)}</b></span>
          <span><i style={{ background: "#f97316" }} />Expenses <b>{formatINR(h.expense)}</b></span>
          <span><i style={{ background: "#60a5fa" }} />Net <b className={h.net < 0 ? "neg" : ""}>{formatINR(h.net)}</b></span>
        </div>
      )}
      <div className="fin-legend">
        <span><i style={{ background: "#10b981" }} />Income</span>
        <span><i style={{ background: "#f97316" }} />Expenses</span>
        <span><i className="line" style={{ background: "#60a5fa" }} />Net profit</span>
      </div>
    </div>
  );
}
