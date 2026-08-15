import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { Product, ProductDraft } from '@/apis/products-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ProductFormProps {
  initialValue?: Product
  isSaving: boolean
  submitLabel: string
  onSubmit: (product: ProductDraft) => Promise<void>
}

export function ProductForm({
  initialValue,
  isSaving,
  submitLabel,
  onSubmit,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductDraft>(() => ({
    name: initialValue?.name ?? '',
    kitchenName: initialValue?.kitchenName ?? '',
    category: initialValue?.category ?? '',
    isActive: initialValue?.isActive ?? true,
    description: initialValue?.description ?? '',
  }))

  function updateField<Field extends keyof ProductDraft>(field: Field, value: ProductDraft[Field]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: formData.name.trim(),
      kitchenName: formData.kitchenName.trim(),
      category: formData.category.trim(),
      isActive: formData.isActive,
      description: formData.description.trim(),
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
            placeholder="Margherita Pizza"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Kitchen name
          <Input
            value={formData.kitchenName}
            onChange={(event) => updateField('kitchenName', event.target.value)}
            placeholder="MARG"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Category
          <Input
            value={formData.category}
            onChange={(event) => updateField('category', event.target.value)}
            placeholder="Pizza"
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={formData.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          Active product
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Description
          <textarea
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Short product description"
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
