import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
}

export function ProductSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  isLoading = false,
}: ProductSearchProps) {
  const trimmedValue = value.trim()
  let statusText = `${totalCount} products available`

  if (isLoading) {
    statusText = trimmedValue ? 'Searching products...' : 'Refreshing products...'
  } else if (trimmedValue) {
    statusText = `${resultCount} of ${totalCount} products matched`
  }

  return (
    <div className="grid gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name or kitchen name"
        />
      </div>
      <p className="text-xs text-muted-foreground">{statusText}</p>
    </div>
  )
}
