import { AlertCircle, ArrowLeft, Edit, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { isCustomersApiConfigured, type CustomerDraft } from '@/apis/customers-api'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import { CustomerForm } from '@/components/customers/CustomerForm'
import {
  CustomerNotesSection,
  CustomerOverviewSection,
  EmptyFutureSection,
} from '@/components/customers/CustomerProfileSections'
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
} from '@/components/ui/dialog'
import { useCustomersStore } from '@/context/customers-store'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Order History' },
  { id: 'spending', label: 'Spending' },
  { id: 'vouchers', label: 'Gift Vouchers' },
  { id: 'notes', label: 'Notes' },
] as const

type CustomerProfileTab = (typeof tabs)[number]['id']

export function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const customers = useCustomersStore((state) => state.customers)
  const currentCustomer = useCustomersStore((state) => state.currentCustomer)
  const isProfileLoading = useCustomersStore((state) => state.isProfileLoading)
  const isSaving = useCustomersStore((state) => state.isSaving)
  const error = useCustomersStore((state) => state.error)
  const fetchCustomerById = useCustomersStore((state) => state.fetchCustomerById)
  const updateCustomer = useCustomersStore((state) => state.updateCustomer)
  const deleteCustomer = useCustomersStore((state) => state.deleteCustomer)
  const [activeTab, setActiveTab] = useState<CustomerProfileTab>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const customer = useMemo(() => {
    if (!customerId) return null
    if (currentCustomer?.id === customerId) return currentCustomer
    return customers.find((storedCustomer) => storedCustomer.id === customerId) ?? null
  }, [currentCustomer, customerId, customers])

  useEffect(() => {
    if (customerId && isCustomersApiConfigured) {
      void fetchCustomerById(customerId)
    }
  }, [customerId, fetchCustomerById])

  async function handleUpdateCustomer(customerDraft: CustomerDraft) {
    if (!customer) return

    await updateCustomer(customer.id, customerDraft)
    setEditOpen(false)
  }

  async function handleDeleteCustomer() {
    if (!customer) return

    await deleteCustomer(customer.id)
    setDeleteOpen(false)
    navigate('/customers')
  }

  function renderActiveTab() {
    if (!customer) return null

    if (activeTab === 'overview') {
      return <CustomerOverviewSection customer={customer} />
    }

    if (activeTab === 'notes') {
      return <CustomerNotesSection customer={customer} />
    }

    if (activeTab === 'orders') {
      return (
        <EmptyFutureSection
          title="Order History"
          description="Future orders will be linked by order.customerId or manually linked from order-time snapshots."
          icon="history"
        />
      )
    }

    if (activeTab === 'spending') {
      return (
        <EmptyFutureSection
          title="Spending"
          description="Spending totals will be derived from normalized orders, payments, tips, and delivery fees."
          icon="spending"
        />
      )
    }

    return (
      <EmptyFutureSection
        title="Gift Vouchers"
        description="Gift voucher balances and redemptions will live in a separate voucher model, not inside customer notes."
        icon="voucher"
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="w-fit px-0">
            <Link to="/customers">
              <ArrowLeft className="size-4" />
              Customers
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              {customer?.name || 'Customer profile'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {customer ? `${customer.address || 'No address'} ${customer.postcode || ''}`.trim() : 'Loading customer details'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!customer} onClick={() => setEditOpen(true)}>
            <Edit className="size-4" />
            Edit customer
          </Button>
          <Button variant="destructive" disabled={!customer} onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Archive/Delete
          </Button>
        </div>
      </section>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardContent className="flex gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {isProfileLoading && !customer && (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading customer profile
            </span>
          </CardContent>
        </Card>
      )}

      {!isProfileLoading && !customer && (
        <Card>
          <CardHeader>
            <CardTitle>Customer not found</CardTitle>
            <CardDescription>
              This customer could not be loaded from the current customer list or API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/customers">Back to customers</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {customer && (
        <>
          <div className="flex gap-2 overflow-x-auto border-b pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {renderActiveTab()}
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              This updates the current Customers record. More profile fields can be added later without changing the route.
            </DialogDescription>
          </DialogHeader>
          {customer && (
            <CustomerForm
              key={customer.id}
              initialValue={customer}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateCustomer}
            />
          )}
        </DialogContent>
      </Dialog>

      <CustomerDeleteDialog
        customer={customer}
        open={deleteOpen}
        isSaving={isSaving}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeleteCustomer}
      />
    </div>
  )
}
