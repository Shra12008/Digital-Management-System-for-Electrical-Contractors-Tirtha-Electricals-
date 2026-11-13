import React from "react";

/**
 * Generic table wrapper reused by Projects / Labour / DailyWork /
 * Inventory / Invoice / Reports pages.
 *
 * columns: [{ key, label, render?: (row) => node }]
 * rows: array of data objects
 */
export default function Table({
  columns,
  rows,
  tableClassName = "invoice-table",
  emptyIcon = "fa-inbox",
  emptyTitle = "No records found",
  emptyText = "Data will appear here once available.",
  scroll = true,
}) {
  const content = (
    <table className={tableClassName}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id ?? idx}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row, idx) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        <i className={`fas ${emptyIcon}`}></i>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  return scroll ? <div className="table-scroll">{content}</div> : content;
}
