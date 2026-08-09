import {
  Activity,
  Bell,
  CreditCard,
  Download,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState } from 'react'

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

const metrics = [
  { label: 'Revenue', value: '$128.4K', change: '+12.8%', icon: CreditCard },
  { label: 'Active users', value: '24,892', change: '+8.2%', icon: Users },
  { label: 'Security score', value: '98.1%', change: '+2.4%', icon: ShieldCheck },
  { label: 'Open tasks', value: '37', change: '-5.1%', icon: Activity },
]

const customers = [
  {
    name: 'Acme Finance',
    owner: 'Maya Chen',
    plan: 'Enterprise',
    status: 'Healthy',
    revenue: '$18,420',
    lastSeen: '2 min ago',
  },
  {
    name: 'Northstar Retail',
    owner: 'Jon Bell',
    plan: 'Business',
    status: 'Review',
    revenue: '$9,180',
    lastSeen: '18 min ago',
  },
  {
    name: 'Vertex Labs',
    owner: 'Priya Shah',
    plan: 'Enterprise',
    status: 'Healthy',
    revenue: '$22,760',
    lastSeen: '1 hr ago',
  },
  {
    name: 'Atlas Supply',
    owner: 'Noah Reed',
    plan: 'Starter',
    status: 'Pending',
    revenue: '$2,940',
    lastSeen: '3 hrs ago',
  },
]

const activity = [
  'Role policy updated for Finance Admins',
  'Quarterly billing export completed',
  'New SSO certificate uploaded',
  'Northstar Retail flagged for review',
]

function statusVariant(status: string) {
  if (status === 'Healthy') return 'success'
  if (status === 'Review') return 'warning'
  return 'secondary'
}

function App() {
  const [open, setOpen] = useState(false)

  function handleCreateAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpen(false)
  }

  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/90 px-4 py-5 backdrop-blur lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Core Admin</p>
            <p className="text-xs text-muted-foreground">Operations console</p>
          </div>
        </div>
        <nav className="space-y-1">
          {['Overview', 'Customers', 'Billing', 'Access', 'Reports'].map((item) => (
            <Button
              key={item}
              variant={item === 'Overview' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              {item}
            </Button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search customers, invoices, or users" />
            </div>
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  New admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateAdmin}>
                  <DialogHeader>
                    <DialogTitle>Create admin user</DialogTitle>
                    <DialogDescription>
                      Invite a teammate and assign initial console access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <label className="grid gap-2 text-sm font-medium">
                      Full name
                      <Input required placeholder="Jordan Lee" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Work email
                      <Input required type="email" placeholder="jordan@company.com" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Role
                      <Input required placeholder="Billing manager" />
                    </label>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Send invite</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Admin dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitor customer health, revenue movement, and access controls.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="size-4" />
                Export
              </Button>
              <Button variant="secondary">View reports</Button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardDescription>{metric.label}</CardDescription>
                  <metric.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.change} from last month</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Customer accounts</CardTitle>
                  <CardDescription>Current book of business and support status.</CardDescription>
                </div>
                <Button variant="outline" size="sm">Manage columns</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.name}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.owner}</TableCell>
                        <TableCell>{customer.plan}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(customer.status)}>{customer.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{customer.revenue}</TableCell>
                        <TableCell className="text-muted-foreground">{customer.lastSeen}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" aria-label={`Open ${customer.name} actions`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Operational changes requiring awareness.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity.map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <div className="mt-1 flex size-6 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item}</p>
                        <p className="text-xs text-muted-foreground">Updated today</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
