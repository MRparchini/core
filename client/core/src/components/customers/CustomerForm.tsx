import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import type { Customer, CustomerDraft } from '@/apis/customers-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface CustomerFormProps {
  initialValue?: Customer
  isSaving: boolean
  submitLabel: string
  onSubmit: (customer: CustomerDraft) => Promise<void>
}

export function CustomerForm({
  initialValue,
  isSaving,
  submitLabel,
  onSubmit,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerDraft>(() => ({
    code: initialValue?.code ?? '',
    name: initialValue?.name ?? '',
    address: initialValue?.address ?? '',
    postcode: initialValue?.postcode ?? '',
    telephoneNumber: initialValue?.telephoneNumber ?? '',
    notes: initialValue?.notes ?? '',
  }))

  function updateField(field: keyof CustomerDraft, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      code: formData.code.trim(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      postcode: formData.postcode.trim(),
      telephoneNumber: formData.telephoneNumber.trim(),
      notes: formData.notes.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <label className="grid gap-2 text-sm font-medium">
          Code
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder="CUST-001"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Name
          <Input
            required
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="John Smith"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Address
          <Input
            value={formData.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="10 High Street"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Postcode
            <Input
              value={formData.postcode}
              onChange={(event) => updateField('postcode', event.target.value)}
              placeholder="CF44 7AA"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Telephone number
            <Input
              value={formData.telephoneNumber}
              onChange={(event) => updateField('telephoneNumber', event.target.value)}
              placeholder="07123456789"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Notes
          <textarea
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            value={formData.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Regular customer"
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
