import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  showPageSize?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  showPageSize = false,
  className,
}: PaginationProps) {
  const pages = generatePageNumbers(currentPage, totalPages)

  function generatePageNumbers(current: number, total: number): (number | string)[] {
    const delta = 1
    const range: (number | string)[] = []
    const left = Math.max(2, current - delta)
    const right = Math.min(total - 1, current + delta)

    range.push(1)

    if (left > 2) {
      range.push('ellipsis')
    }

    for (let i = left; i <= right; i++) {
      range.push(i)
    }

    if (right < total - 1) {
      range.push('ellipsis')
    }

    if (total > 1) {
      range.push(total)
    }

    return range
  }

  if (totalPages <= 1) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-4',
        'text-sm text-marine-600',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showPageSize && onPageSizeChange && (
          <>
            <span className="hidden sm:inline">Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-marine-200 rounded px-2 py-1 text-sm bg-white
                         focus:outline-none focus:ring-1 focus:ring-marine-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline">par page</span>
          </>
        )}

        {totalItems !== undefined && (
          <span className="text-xs text-marine-500">
            {Math.min((currentPage - 1) * pageSize + 1, totalItems)}-{Math.min(currentPage * pageSize, totalItems)} sur {totalItems}
          </span>
        )}
      </div>

      <nav
        className="inline-flex items-center gap-1"
        aria-label="Navigation de pagination"
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'hover:bg-marine-50 disabled:opacity-50 disabled:cursor-not-allowed',
            'text-marine-600 hover:text-marine-900'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1.5">
              <MoreHorizontal className="h-4 w-4 text-marine-400" />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'min-w-[32px] h-8 px-2.5 rounded-lg font-medium text-sm transition-all',
                currentPage === page
                  ? 'bg-marine-500 text-white'
                  : 'text-marine-600 hover:bg-marine-50 hover:text-marine-900'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'hover:bg-marine-50 disabled:opacity-50 disabled:cursor-not-allowed',
            'text-marine-600 hover:text-marine-900'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}
