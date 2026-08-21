import { Loader2 } from 'lucide-react'

import type { Category } from '@/apis/categories-api'
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

interface CategoryDeleteDialogProps {
  category: Category | null
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}

export function CategoryDeleteDialog({
  category,
  open,
  isSaving,
  onOpenChange,
  onDelete,
}: CategoryDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete category</DialogTitle>
          <DialogDescription>
            This permanently removes the row from the Categories worksheet.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <div className="flex items-center gap-3">
            <span
              className="size-5 rounded border"
              style={{ backgroundColor: category?.color || 'transparent' }}
            />
            <div>
              <p className="font-medium">{category?.name || 'Unnamed category'}</p>
              <p className="text-muted-foreground">ID {category?.id}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => void onDelete()} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Delete category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
