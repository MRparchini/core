import { BarChart3 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ReportPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reporting pages belong in src/pages/report.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Reports module
          </CardTitle>
          <CardDescription>
            Add report-specific API modules under src/apis and global state under src/context when this service is connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is ready for report dashboards, filters, exports, and analytics tables.
        </CardContent>
      </Card>
    </div>
  )
}
