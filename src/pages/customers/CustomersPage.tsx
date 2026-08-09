import { AlertCircle, Edit, Loader2, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { isCustomersApiConfigured, type Customer, type CustomerDraft } from '@/apis/customers-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCustomersStore } from '@/context/customers-store'


interface CustomerFormProps {
  initialValue?: Customer
  isSaving: boolean
  submitLabel: string
  onSubmit: (customer: CustomerDraft) => Promise<void>
}

function CustomerForm({ initialValue, isSaving, submitLabel, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerDraft>(() => ({
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

export function CustomersPage() {
  const customers = useCustomersStore((state) => state.customers)
  const searchQuery = useCustomersStore((state) => state.searchQuery)
  const isLoading = useCustomersStore((state) => state.isLoading)
  const isSaving = useCustomersStore((state) => state.isSaving)
  const error = useCustomersStore((state) => state.error)
  const selectedCustomer = useCustomersStore((state) => state.selectedCustomer)
  const setSearchQuery = useCustomersStore((state) => state.setSearchQuery)
  const setSelectedCustomer = useCustomersStore((state) => state.setSelectedCustomer)
  const fetchCustomers = useCustomersStore((state) => state.fetchCustomers)
  const createCustomer = useCustomersStore((state) => state.createCustomer)
  const updateCustomer = useCustomersStore((state) => state.updateCustomer)
  const deleteCustomer = useCustomersStore((state) => state.deleteCustomer)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (isCustomersApiConfigured) {
      void fetchCustomers()
    }
  }, [fetchCustomers])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return customers

    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.address,
        customer.postcode,
        customer.telephoneNumber,
        customer.notes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [customers, searchQuery])

  async function handleCreateCustomer(customer: CustomerDraft) {
    await createCustomer(customer)
    setCreateOpen(false)
  }

  async function handleUpdateCustomer(customer: CustomerDraft) {
    if (!selectedCustomer) return

    await updateCustomer(selectedCustomer.id, customer)
    setEditOpen(false)
  }

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return

    await deleteCustomer(selectedCustomer.id)
    setDeleteOpen(false)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage records stored in the Google Sheet Customers tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void fetchCustomers()} disabled={isLoading || !isCustomersApiConfigured}>
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isCustomersApiConfigured}>
                <Plus className="size-4" />
                New customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create customer</DialogTitle>
                <DialogDescription>
                  Only name is required by the Apps Script API. The ID is generated automatically.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                key={createOpen ? 'create-open' : 'create-closed'}
                isSaving={isSaving}
                submitLabel="Create customer"
                onSubmit={handleCreateCustomer}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isCustomersApiConfigured && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Google Apps Script API is not configured.</p>
              <p>Add your deployment URL to VITE_GOOGLE_APPS_SCRIPT_URL in .env.local, then restart Vite.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardContent className="flex gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total customers</CardDescription>
            <CardTitle className="text-2xl">{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Visible results</CardDescription>
            <CardTitle className="text-2xl">{filteredCustomers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>API status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant={isCustomersApiConfigured ? 'success' : 'warning'}>
                {isCustomersApiConfigured ? 'Configured' : 'Missing env'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Customer records</CardTitle>
            <CardDescription>
              Columns match the sheet: ID, Name, Address, postcode, Telephone number, Notes.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customers"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Telephone number</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading customers
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.address || '-'}</TableCell>
                  <TableCell>{customer.postcode || '-'}</TableCell>
                  <TableCell>{customer.telephoneNumber || '-'}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{customer.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setEditOpen(true)
                        }}
                      >
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Updates only the editable customer fields. The ID remains unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              key={selectedCustomer.id}
              initialValue={selectedCustomer}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateCustomer}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This deletes the matching Google Sheet row and does not renumber other IDs.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{selectedCustomer?.name}</p>
            <p className="text-muted-foreground">ID {selectedCustomer?.id}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => void handleDeleteCustomer()} disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Delete customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

