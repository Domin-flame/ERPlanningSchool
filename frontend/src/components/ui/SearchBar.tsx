import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchResult {
  id: string | number
  label: string
  description?: string
  category?: string
  path?: string
  icon?: React.ReactNode
}

export interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  results?: SearchResult[]
  onResultClick?: (result: SearchResult) => void
  maxResults?: number
  className?: string
  showRecent?: boolean
}

const recentSearchesKey = 'cw-recent-searches'

export function SearchBar({
  placeholder = 'Rechercher...',
  onSearch,
  results = [],
  onResultClick,
  maxResults = 5,
  className,
  showRecent = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(recentSearchesKey)
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch?.(value)
    if (value.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem(recentSearchesKey, JSON.stringify(updated))
  }

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query)
    onResultClick?.(result)
    setQuery('')
    setIsOpen(false)
  }

  const filteredResults = results.filter(
    (r) =>
      r.label.toLowerCase().includes(query.toLowerCase()) ||
      (r.description?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      (r.category?.toLowerCase().includes(query.toLowerCase()) ?? false)
  ).slice(0, maxResults)

  const hasResults = query.length >= 2 && filteredResults.length > 0
  const hasRecent = showRecent && query.length < 2 && recentSearches.length > 0

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-md', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-marine-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-4 py-2 rounded-lg border border-marine-200',
            'focus:outline-none focus:ring-2 focus:ring-marine-500 focus:border-transparent',
            'placeholder:text-marine-300 transition-all duration-200',
            'bg-white text-marine-900'
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-marine-400 hover:text-marine-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (hasResults || hasRecent) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-marine-200 z-50 overflow-hidden"
          >
            {hasResults && (
              <div className="py-1">
                {filteredResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start gap-3 px-3 py-2 text-left
                               hover:bg-marine-50 transition-colors"
                  >
                    {result.icon && (
                      <span className="mt-0.5 text-marine-400">{result.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-marine-900">
                        {result.label}
                      </p>
                      {result.description && (
                        <p className="text-xs text-marine-500 truncate">
                          {result.description}
                        </p>
                      )}
                      {result.category && (
                        <span className="text-xs text-marine-400">
                          {result.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {hasRecent && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-xs font-semibold text-marine-500 uppercase">
                  Recherches récentes
                </p>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(search)
                      saveRecentSearch(search)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left
                               hover:bg-marine-50 transition-colors"
                  >
                    <Search className="h-3.5 w-3.5 text-marine-400" />
                    <span className="text-sm text-marine-700">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
