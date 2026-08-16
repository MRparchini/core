import { AlertCircle, CheckCircle2, Edit, Eye, EyeOff, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { isMenusApiConfigured, type Menu, type MenuDraft } from '@/apis/menus-api'
import { MenuDeactivateDialog } from '@/components/menus/MenuDeactivateDialog'
import { MenuForm } from '@/components/menus/MenuForm'
import { MenuSearch } from '@/components/menus/MenuSearch'
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
import { useMenusStore } from '@/context/menus-store'

export function MenusPage() {
  const menus = useMenusStore((state) => state.menus)
  const searchQuery = useMenusStore((state) => state.searchQuery)
  const activeStatus = useMenusStore((state) => state.activeStatus)
  const menuPage = useMenusStore((state) => state.menuPage)
  const menuPageSize = useMenusStore((state) => state.menuPageSize)
  const totalMenus = useMenusStore((state) => state.totalMenus)
  const totalPages = useMenusStore((state) => state.totalPages)
  const hasPreviousPage = useMenusStore((state) => state.hasPreviousPage)
  const hasNextPage = useMenusStore((state) => state.hasNextPage)
  const isLoading = useMenusStore((state) => state.isLoading)
  const isSaving = useMenusStore((state) => state.isSaving)
  const error = useMenusStore((state) => state.error)
  const successMessage = useMenusStore((state) => state.successMessage)
  const selectedMenu = useMenusStore((state) => state.selectedMenu)
  const setSearchQuery = useMenusStore((state) => state.setSearchQuery)
  const setActiveStatus = useMenusStore((state) => state.setActiveStatus)
  const setMenuPage = useMenusStore((state) => state.setMenuPage)
  const setMenuPageSize = useMenusStore((state) => state.setMenuPageSize)
  const setSelectedMenu = useMenusStore((state) => state.setSelectedMenu)
  const fetchMenus = useMenusStore((state) => state.fetchMenus)
  const createMenu = useMenusStore((state) => state.createMenu)
  const updateMenu = useMenusStore((state) => state.updateMenu)
  const activateMenu = useMenusStore((state) => state.activateMenu)
  const deactivateMenu = useMenusStore((state) => state.deactivateMenu)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  useEffect(() => {
    if (!isMenusApiConfigured) return

    const timeoutId = window.setTimeout(() => {
      void fetchMenus({
        page: menuPage,
        pageSize: menuPageSize,
        query: searchQuery,
        activeStatus,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [activeStatus, fetchMenus, menuPage, menuPageSize, searchQuery])

  async function handleCreateMenu(menu: MenuDraft) {
    await createMenu(menu)
    setCreateOpen(false)
  }

  async function handleUpdateMenu(menu: MenuDraft) {
    if (!selectedMenu) return

    await updateMenu(selectedMenu.id, menu)
    setEditOpen(false)
  }

  async function handleDeactivateMenu() {
    if (!selectedMenu) return

    await deactivateMenu(selectedMenu.id)
    setDeactivateOpen(false)
  }

  function openEditMenu(menu: Menu) {
    setSelectedMenu(menu)
    setEditOpen(true)
  }

  function openDeactivateMenu(menu: Menu) {
    setSelectedMenu(menu)
    setDeactivateOpen(true)
  }

  const activeMenusOnPage = menus.filter((menu) => menu.isActive).length

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Menus</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage menu groups stored in the Google Sheet Menus tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchMenus({ page: menuPage, pageSize: menuPageSize, query: searchQuery, activeStatus })}
            disabled={isLoading || !isMenusApiConfigured}
          >
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isMenusApiConfigured}>
                <Plus className="size-4" />
                New menu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create menu</DialogTitle>
                <DialogDescription>
                  Menu ID and timestamps are generated automatically. Name is required.
                </DialogDescription>
              </DialogHeader>
              <MenuForm
                key={createOpen ? 'create-open' : 'create-closed'}
                isSaving={isSaving}
                submitLabel="Create menu"
                onSubmit={handleCreateMenu}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isMenusApiConfigured && (
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

      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CardContent className="flex gap-3 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p>{successMessage}</p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total menus</CardDescription>
            <CardTitle className="text-2xl">{totalMenus}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active on page</CardDescription>
            <CardTitle className="text-2xl">{activeMenusOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>API status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant={isMenusApiConfigured ? 'success' : 'warning'}>
                {isMenusApiConfigured ? 'Configured' : 'Missing env'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Menu records</CardTitle>
            <CardDescription>
              Search matches menu name and description before the current page is returned.
            </CardDescription>
          </div>
          <div className="w-full lg:w-[420px]">
            <MenuSearch
              value={searchQuery}
              activeStatus={activeStatus}
              onChange={setSearchQuery}
              onActiveStatusChange={setActiveStatus}
              resultCount={menus.length}
              totalCount={totalMenus}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sort order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && menus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading menus
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && menus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    No menus found.
                  </TableCell>
                </TableRow>
              )}

              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell className="font-medium">{menu.name || 'Unnamed menu'}</TableCell>
                  <TableCell className="max-w-[360px] truncate">{menu.description || '-'}</TableCell>
                  <TableCell>{menu.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={menu.isActive ? 'success' : 'secondary'}>
                      {menu.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditMenu(menu)}>
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      {menu.isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => openDeactivateMenu(menu)}>
                          <EyeOff className="size-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => void activateMenu(menu.id)} disabled={isSaving}>
                          <Eye className="size-4" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Page {menuPage} of {totalPages} - {totalMenus} menus
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows
              <select
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                value={menuPageSize}
                onChange={(event) => setMenuPageSize(Number(event.target.value))}
                disabled={isLoading}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuPage(menuPage - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuPage(menuPage + 1)}
              disabled={isLoading || !hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit menu</DialogTitle>
            <DialogDescription>
              Updates editable menu fields. ID and created timestamp remain unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedMenu && (
            <MenuForm
              key={selectedMenu.id}
              initialValue={selectedMenu}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateMenu}
            />
          )}
        </DialogContent>
      </Dialog>

      <MenuDeactivateDialog
        menu={selectedMenu}
        open={deactivateOpen}
        isSaving={isSaving}
        onOpenChange={setDeactivateOpen}
        onDeactivate={handleDeactivateMenu}
      />
    </div>
  )
}
