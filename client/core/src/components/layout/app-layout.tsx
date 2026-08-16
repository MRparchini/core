import { Bell, LayoutDashboard, Menu, Package, Search, SquareMenu, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Menus', path: '/menus', icon: SquareMenu },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Report', path: '/report', icon: LayoutDashboard },
]

export function AppLayout() {
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
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              )}
            </NavLink>
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
              <Input className="pl-9" placeholder="Search the admin console" />
            </div>
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
          </div>
        </header>

        <div className={cn('px-4 py-6 sm:px-6 lg:px-8')}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

