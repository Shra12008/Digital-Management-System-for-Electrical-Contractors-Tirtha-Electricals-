import React from "react";

/**
 * Generic card used across Dashboard / Projects / Labour / Invoice /
 * Accounts / Inventory pages for the small metric/summary tiles.
 *
 * Usage:
 *   <Card label="Total Revenue" value="₹0" meta="+12.5% vs last month" />
 *   <Card variant="metric" icon="fa-indian-rupee-sign" iconBg="bg-amber"
 *         label="Total Revenue" value="₹0" change="+12.5%" trend="positive" />
 */
export default function Card({
  variant = "summary",
  label,
  value,
  meta,
  icon,
  iconBg = "bg-blue",
  change,
  trend = "positive",
  period = "vs last month",
}) {
  if (variant === "metric") {
    return (
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">{label}</span>
          {icon && (
            <div className={`metric-icon ${iconBg}`}>
              <i className={`fas ${icon}`}></i>
            </div>
          )}
        </div>
        <div className="metric-value">{value}</div>
        {change && (
          <div className={`metric-change ${trend}`}>
            <i className={`fas ${trend === "positive" ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}></i>
            <span>{change}</span>
            <span className="period">{period}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="summary-card">
      <span className="summary-label">{label}</span>
      <strong>{value}</strong>
      {meta && <span className="summary-meta">{meta}</span>}
    </div>
  );
}
