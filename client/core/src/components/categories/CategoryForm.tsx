import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { Category, CategoryDraft } from '@/apis/categories-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface CategoryFormProps {
  initialValue?: Category
  isSaving: boolean
  submitLabel: string
  onSubmit: (category: CategoryDraft) => Promise<void>
}

const defaultCategoryColor = '#2563eb'

export function CategoryForm({
  initialValue,
  isSaving,
  submitLabel,
  onSubmit,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryDraft>(() => ({
    name: initialValue?.name ?? '',
    color: initialValue?.color || defaultCategoryColor,
    applyColorToAllItems: initialValue?.applyColorToAllItems ?? false,
  }))
  const colorPickerValue = /^#[0-9a-f]{6}$/i.test(formData.color)
    ? formData.color
    : defaultCategoryColor

  function updateField<Field extends keyof CategoryDraft>(field: Field, value: CategoryDraft[Field]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: formData.name.trim(),
      color: formData.color.trim(),
      applyColorToAllItems: formData.applyColorToAllItems,
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
            placeholder="Pizza"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Color
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Input
              aria-label="Category color picker"
              className="p-1"
              type="color"
              value={colorPickerValue}
              onChange={(event) => updateField('color', event.target.value)}
            />
            <Input
              value={formData.color}
              onChange={(event) => updateField('color', event.target.value)}
              placeholder="#2563eb"
            />
          </div>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={formData.applyColorToAllItems}
            onChange={(event) => updateField('applyColorToAllItems', event.target.checked)}
          />
          Apply color to all items
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
