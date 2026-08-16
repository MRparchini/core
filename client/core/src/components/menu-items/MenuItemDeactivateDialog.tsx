import { Loader2 } from 'lucide-react'

import type { MenuItem } from '@/apis/menu-items-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MenuItemDeactivateDialogProps {
  menuItem: MenuItem | null
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onDeactivate: () => Promise<void>
}

export function MenuItemDeactivateDialog({
  menuItem,
  open,
  isSaving,
  onOpenChange,
  onDeactivate,
}: MenuItemDeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate menu item</DialogTitle>
          <DialogDescription>
            This keeps the row in the MenuItems worksheet and removes this relationship from effective availability.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{menuItem?.effectiveDisplayName || 'Unnamed menu item'}</p>
          <p className="text-muted-foreground">{menuItem?.menuName || 'Unknown menu'} / {menuItem?.productName || 'Unknown product'}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => void onDeactivate()} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Deactivate menu item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
