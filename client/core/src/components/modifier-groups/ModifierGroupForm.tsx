import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { ModifierGroup, ModifierGroupDraft } from '@/apis/modifier-groups-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ModifierGroupFormProps {
  initialValue?: ModifierGroup
  isSaving: boolean
  submitLabel: string
  onSubmit: (modifierGroup: ModifierGroupDraft) => Promise<void>
}

export function ModifierGroupForm({
  initialValue,
  isSaving,
  submitLabel,
  onSubmit,
}: ModifierGroupFormProps) {
  const [formData, setFormData] = useState<ModifierGroupDraft>(() => ({
    name: initialValue?.name ?? '',
  }))

  function updateField<Field extends keyof ModifierGroupDraft>(field: Field, value: ModifierGroupDraft[Field]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: formData.name.trim(),
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
            placeholder="Pizza toppings"
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
