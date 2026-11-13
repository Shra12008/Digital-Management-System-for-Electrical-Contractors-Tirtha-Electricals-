import React, { useState } from "react";
import { formatCompact } from "../../utils/financeUtils";
import { formatINR } from "../../utils/invoiceUtils";

const SIZE = 220;
const R = 78;
const C = 2 * Math.PI * R;

/** Ring chart. data: [{ category, amount, pct, color }] */
export default function DonutChart({ data, centerLabel = "Total" }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const active = hover !== null ? data[hover] : null;
  let offset = 0;

  return (
    <div className="fin-donut">
      <div className="fin-donut-ring">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Expense breakdown by category">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth="26" style={{ stroke: "var(--bg-surface-2)" }} />
          {data.map((d, i) => {
            const len = (d.amount / total) * C;
            const seg = Math.max(len - 2.5, 0.5);
            const el = (
              <circle key={d.category} cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={d.color}
                strokeWidth={hover === i ? 32 : 26} strokeDasharray={`${seg} ${C - seg}`} strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} opacity={hover === null || hover === i ? 1 : 0.35}
                style={{ transition: "all .15s" }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            );
            offset += len;
            return el;
          })}
          <text x={SIZE / 2} y={SIZE / 2 - 6} textAnchor="middle" className="fin-donut-label">{active ? active.category : centerLabel}</text>
          <text x={SIZE / 2} y={SIZE / 2 + 20} textAnchor="middle" className="fin-donut-value">{formatCompact(active ? active.amount : total)}</text>
        </svg>
      </div>
      <ul className="fin-donut-legend">
        {data.map((d, i) => (
          <li key={d.category} className={hover === i ? "active" : ""} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: d.color }} />
            <span className="name">{d.category}</span>
            <span className="pct">{d.pct.toFixed(0)}%</span>
            <span className="amt">{formatINR(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
