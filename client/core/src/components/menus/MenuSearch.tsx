import { Search } from 'lucide-react'

import type { MenuActiveStatus } from '@/apis/menus-api'
import { Input } from '@/components/ui/input'

interface MenuSearchProps {
  value: string
  activeStatus: MenuActiveStatus
  onChange: (value: string) => void
  onActiveStatusChange: (value: MenuActiveStatus) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
}

export function MenuSearch({
  value,
  activeStatus,
  onChange,
  onActiveStatusChange,
  resultCount,
  totalCount,
  isLoading = false,
}: MenuSearchProps) {
  const trimmedValue = value.trim()
  let statusText = `${totalCount} menus available`

  if (isLoading) {
    statusText = trimmedValue ? 'Searching menus...' : 'Refreshing menus...'
  } else if (trimmedValue) {
    statusText = `${resultCount} of ${totalCount} menus matched`
  }

  return (
    <div className="grid gap-3">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name or description"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={activeStatus}
          onChange={(event) => onActiveStatusChange(event.target.value as MenuActiveStatus)}
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
