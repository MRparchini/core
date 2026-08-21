import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface CategorySearchProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
}

export function CategorySearch({
  value,
  onChange,
  resultCount,
  totalCount,
  isLoading = false,
}: CategorySearchProps) {
  const trimmedValue = value.trim()
  let statusText = `${totalCount} categories available`

  if (isLoading) {
    statusText = trimmedValue ? 'Searching categories...' : 'Refreshing categories...'
  } else if (trimmedValue) {
    statusText = `${resultCount} of ${totalCount} categories matched`
  }

  return (
    <div className="grid gap-3">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name or color"
        />
      </div>
      <p className="text-xs text-muted-foreground">{statusText}</p>
    </div>
  )
}
