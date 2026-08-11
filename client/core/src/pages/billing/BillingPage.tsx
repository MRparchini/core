import { CreditCard } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function BillingPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Billing pages belong in src/pages/billing.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Billing module
          </CardTitle>
          <CardDescription>
            Keep billing requests in src/apis and shared billing state in src/context as this service grows.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is ready for invoice tables, payment status, and account billing actions.
        </CardContent>
      </Card>
    </div>
  )
}
