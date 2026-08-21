import { Loader2 } from 'lucide-react'

import type { ModifierGroup } from '@/apis/modifier-groups-api'
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

interface ModifierGroupDeleteDialogProps {
  modifierGroup: ModifierGroup | null
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}

export function ModifierGroupDeleteDialog({
  modifierGroup,
  open,
  isSaving,
  onOpenChange,
  onDelete,
}: ModifierGroupDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete modifier group</DialogTitle>
          <DialogDescription>
            This permanently removes the row from the ModifierGroups worksheet.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{modifierGroup?.name || 'Unnamed modifier group'}</p>
          <p className="text-muted-foreground">ID {modifierGroup?.id}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => void onDelete()} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Delete modifier group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
