import { Search } from 'lucide-react'

import type { Menu } from '@/apis/menus-api'
import type { MenuItemActiveStatus } from '@/apis/menu-items-api'
import { Input } from '@/components/ui/input'

interface MenuItemSearchProps {
  value: string
  menuId: string
  activeStatus: MenuItemActiveStatus
  effectiveStatus: MenuItemActiveStatus
  menus: Menu[]
  onChange: (value: string) => void
  onMenuIdChange: (value: string) => void
  onActiveStatusChange: (value: MenuItemActiveStatus) => void
  onEffectiveStatusChange: (value: MenuItemActiveStatus) => void
  resultCount: number
  totalCount: number
  isLoading?: boolean
}

export function MenuItemSearch({
  value,
  menuId,
  activeStatus,
  effectiveStatus,
  menus,
  onChange,
  onMenuIdChange,
  onActiveStatusChange,
  onEffectiveStatusChange,
  resultCount,
  totalCount,
  isLoading = false,
}: MenuItemSearchProps) {
  const trimmedValue = value.trim()
  let statusText = `${totalCount} menu items available`

  if (isLoading) {
    statusText = trimmedValue ? 'Searching menu items...' : 'Refreshing menu items...'
  } else if (trimmedValue) {
    statusText = `${resultCount} of ${totalCount} menu items matched`
  }

  return (
    <div className="grid gap-3">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search menu, product, display, kitchen"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={menuId}
          onChange={(event) => onMenuIdChange(event.target.value)}
        >
          <option value="">All menus</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name || 'Unnamed menu'}{menu.isActive ? '' : ' (inactive)'}
            </option>
          ))}
        </select>
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={activeStatus}
          onChange={(event) => onActiveStatusChange(event.target.value as MenuItemActiveStatus)}
        >
          <option value="all">Local: all</option>
          <option value="active">Local: active</option>
          <option value="inactive">Local: inactive</option>
        </select>
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={effectiveStatus}
          onChange={(event) => onEffectiveStatusChange(event.target.value as MenuItemActiveStatus)}
        >
          <option value="all">Available: all</option>
          <option value="active">Available</option>
          <option value="inactive">Unavailable</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">{statusText}</p>
    </div>
  )
}
