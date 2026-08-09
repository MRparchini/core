import { AlertCircle, Edit, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { isCustomersApiConfigured, type Customer, type CustomerDraft } from '@/apis/customers-api'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerSearch } from '@/components/customers/CustomerSearch'
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCustomersStore } from '@/context/customers-store'
import { searchCustomers } from '@/lib/customer-search'

export function CustomersPage() {
  const navigate = useNavigate()
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

  const rankedCustomers = useMemo(
    () => searchCustomers(customers, searchQuery),
    [customers, searchQuery],
  )

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

  function openCustomerProfile(customer: Customer) {
    navigate(`/customers/${customer.id}`)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Peppers customer records stored in the Google Sheet Customers tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchCustomers()}
            disabled={isLoading || !isCustomersApiConfigured}
          >
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
                  Only name is required by the current Apps Script API. The ID is generated automatically.
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
            <CardTitle className="text-2xl">{rankedCustomers.length}</CardTitle>
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
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Customer records</CardTitle>
            <CardDescription>
              Search is weighted for restaurant service: postcode and address matches are ranked above weak name matches.
            </CardDescription>
          </div>
          <div className="w-full lg:w-[420px]">
            <CustomerSearch
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={rankedCustomers.length}
              totalCount={customers.length}
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

              {!isLoading && rankedCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && rankedCustomers.map(({ customer, matchedFields }) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  onClick={() => openCustomerProfile(customer)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') openCustomerProfile(customer)
                  }}
                >
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell className="font-medium">
                    <Link
                      className="underline-offset-4 hover:underline"
                      to={`/customers/${customer.id}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {customer.name || 'Unnamed customer'}
                    </Link>
                    {matchedFields.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Matched {matchedFields.join(', ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{customer.address || '-'}</TableCell>
                  <TableCell>{customer.postcode || '-'}</TableCell>
                  <TableCell>{customer.telephoneNumber || '-'}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{customer.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
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
                        onClick={(event) => {
                          event.stopPropagation()
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

      <CustomerDeleteDialog
        customer={selectedCustomer}
        open={deleteOpen}
        isSaving={isSaving}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeleteCustomer}
      />
    </div>
  )
}
