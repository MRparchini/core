import { Loader2 } from 'lucide-react'

import type { Menu } from '@/apis/menus-api'
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

interface MenuDeactivateDialogProps {
  menu: Menu | null
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onDeactivate: () => Promise<void>
}

export function MenuDeactivateDialog({
  menu,
  open,
  isSaving,
  onOpenChange,
  onDeactivate,
}: MenuDeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate menu</DialogTitle>
          <DialogDescription>
            This keeps the row in the Menus worksheet and hides it from active menu selections.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{menu?.name || 'Unnamed menu'}</p>
          <p className="text-muted-foreground">ID {menu?.id}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => void onDeactivate()} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Deactivate menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
