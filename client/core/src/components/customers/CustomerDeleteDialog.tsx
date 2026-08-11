import { Loader2 } from 'lucide-react'

import type { Customer } from '@/apis/customers-api'
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

interface CustomerDeleteDialogProps {
  customer: Customer | null
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}

export function CustomerDeleteDialog({
  customer,
  open,
  isSaving,
  onOpenChange,
  onDelete,
}: CustomerDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
          <DialogDescription>
            This deletes the matching Google Sheet row and does not renumber other IDs.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{customer?.name || 'Unnamed customer'}</p>
          <p className="text-muted-foreground">ID {customer?.id}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => void onDelete()} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Delete customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
