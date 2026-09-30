import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, ErrorState, SkeletonRows } from "./States.jsx";

/**
 * Tableau de données réutilisable.
 * columns: [{ key, header, render?(row), sortValue?(row), align?, width? }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  empty,
  pageSize = 12,
  onRowClick,
  dense = false,
}) {
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const list = rows || [];
    if (!sort) return list;
    const column = columns.find((c) => c.key === sort.key);
    const value = column?.sortValue || ((row) => row[sort.key]);
    return [...list].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "fr");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const toggleSort = (column) => {
    if (column.sortable === false) return;
    setSort((prev) =>
      prev?.key === column.key ? { key: column.key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key: column.key, dir: "asc" }
    );
  };

  if (loading) return <div className="table-state"><SkeletonRows rows={6} /></div>;
  if (error) return <div className="table-state"><ErrorState error={error} onRetry={onRetry} compact /></div>;
  if (!sorted.length) return <div className="table-state">{empty || <EmptyState compact />}</div>;

  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className={`table ${dense ? "table--dense" : ""}`}>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th key={column.key} style={{ width: column.width, textAlign: column.align }} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {column.sortable === false ? (
                      column.header
                    ) : (
                      <button type="button" className="th-sort" onClick={() => toggleSort(column)}>
                        {column.header}
                        {active && (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row) : index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "is-clickable" : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align }}>
                    {column.render ? column.render(row) : row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="table-pagination">
          <span>
            {currentPage * pageSize + 1}–{Math.min(sorted.length, (currentPage + 1) * pageSize)} sur {sorted.length}
          </span>
          <div>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-label="Page précédente">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1} aria-label="Page suivante">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
