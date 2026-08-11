import { FileText, Gift, History, LineChart, UserRound } from 'lucide-react'

import type { Customer } from '@/apis/customers-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomerOverviewSectionProps {
  customer: Customer
}

const details: Array<{ label: string; field: keyof Customer }> = [
  { label: 'Customer ID', field: 'id' },
  { label: 'Name', field: 'name' },
  { label: 'Address', field: 'address' },
  { label: 'Postcode', field: 'postcode' },
  { label: 'Telephone number', field: 'telephoneNumber' },
  { label: 'Notes', field: 'notes' },
]

export function CustomerOverviewSection({ customer }: CustomerOverviewSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5" />
          Overview
        </CardTitle>
        <CardDescription>
          Current customer fields from the Customers sheet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.field} className="rounded-md border bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                {detail.label}
              </dt>
              <dd className="mt-2 break-words text-sm font-medium">
                {customer[detail.field] || '-'}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export function CustomerNotesSection({ customer }: CustomerOverviewSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Notes
        </CardTitle>
        <CardDescription>
          Free-text notes currently stored against this customer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-32 rounded-md border bg-muted/30 p-4 text-sm leading-6">
          {customer.notes || 'No notes have been recorded for this customer.'}
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyFutureSectionProps {
  title: string
  description: string
  icon: 'history' | 'spending' | 'voucher'
}

const emptyIcons = {
  history: History,
  spending: LineChart,
  voucher: Gift,
}

export function EmptyFutureSection({ title, description, icon }: EmptyFutureSectionProps) {
  const Icon = emptyIcons[icon]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          This section will be derived from future order and voucher data. No records are available yet.
        </div>
      </CardContent>
    </Card>
  )
}
