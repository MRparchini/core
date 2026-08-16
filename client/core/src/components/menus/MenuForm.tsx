import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { Menu, MenuDraft } from '@/apis/menus-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface MenuFormProps {
  initialValue?: Menu
  isSaving: boolean
  submitLabel: string
  onSubmit: (menu: MenuDraft) => Promise<void>
}

export function MenuForm({
  initialValue,
  isSaving,
  submitLabel,
  onSubmit,
}: MenuFormProps) {
  const [formData, setFormData] = useState<MenuDraft>(() => ({
    name: initialValue?.name ?? '',
    description: initialValue?.description ?? '',
    sortOrder: initialValue?.sortOrder ?? 0,
    isActive: initialValue?.isActive ?? true,
  }))

  function updateField<Field extends keyof MenuDraft>(field: Field, value: MenuDraft[Field]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      sortOrder: Math.max(0, Math.floor(Number(formData.sortOrder) || 0)),
      isActive: formData.isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <label className="grid gap-2 text-sm font-medium">
          Name
          <Input
            required
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Breakfast"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sort order
          <Input
            min={0}
            step={1}
            type="number"
            value={formData.sortOrder}
            onChange={(event) => updateField('sortOrder', Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={formData.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          Active menu
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Description
          <textarea
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Internal description"
          />
        </label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
