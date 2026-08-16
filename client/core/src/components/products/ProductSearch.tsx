import { Search } from 'lucide-react'

import type { ProductActiveStatus } from '@/apis/products-api'
import { Input } from '@/components/ui/input'

interface ProductSearchProps {
  value: string
  activeStatus: ProductActiveStatus
  onChange: (value: string) => void
  onActiveStatusChange: (value: ProductActiveStatus) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
}

export function ProductSearch({
  value,
  activeStatus,
  onChange,
  onActiveStatusChange,
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
    <div className="grid gap-3">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name or kitchen name"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={activeStatus}
          onChange={(event) => onActiveStatusChange(event.target.value as ProductActiveStatus)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
    </div>
  )
}
