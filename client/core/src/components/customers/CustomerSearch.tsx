import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface CustomerSearchProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
  placeholder?: string
}

export function CustomerSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  isLoading = false,
  placeholder = 'Search by postcode, address, phone, name, code, ID, or notes',
}: CustomerSearchProps) {
  const trimmedValue = value.trim()
  let statusText = `${totalCount} customers available`

  if (isLoading) {
    statusText = trimmedValue ? 'Searching customers...' : 'Refreshing customers...'
  } else if (trimmedValue) {
    statusText = `${resultCount} of ${totalCount} customers matched`
  }

  return (
    <div className="grid gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
      <p className="text-xs text-muted-foreground">{statusText}</p>
    </div>
  )
}
