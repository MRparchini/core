import { AlertCircle, CheckCircle2, Edit, Eye, EyeOff, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getMenus, isMenusRequestCanceled, type Menu } from '@/apis/menus-api'
import {
  formatMenuItemPrice,
  isMenuItemsApiConfigured,
  type MenuItem,
  type MenuItemDraft,
} from '@/apis/menu-items-api'
import { getProducts, isProductsRequestCanceled, type Product } from '@/apis/products-api'
import { MenuItemDeactivateDialog } from '@/components/menu-items/MenuItemDeactivateDialog'
import { MenuItemForm } from '@/components/menu-items/MenuItemForm'
import { MenuItemSearch } from '@/components/menu-items/MenuItemSearch'
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
import { useMenuItemsStore } from '@/context/menu-items-store'

export function MenuItemsPage() {
  const menuItems = useMenuItemsStore((state) => state.menuItems)
  const searchQuery = useMenuItemsStore((state) => state.searchQuery)
  const menuIdFilter = useMenuItemsStore((state) => state.menuIdFilter)
  const activeStatus = useMenuItemsStore((state) => state.activeStatus)
  const effectiveStatus = useMenuItemsStore((state) => state.effectiveStatus)
  const menuItemPage = useMenuItemsStore((state) => state.menuItemPage)
  const menuItemPageSize = useMenuItemsStore((state) => state.menuItemPageSize)
  const totalMenuItems = useMenuItemsStore((state) => state.totalMenuItems)
  const totalPages = useMenuItemsStore((state) => state.totalPages)
  const hasPreviousPage = useMenuItemsStore((state) => state.hasPreviousPage)
  const hasNextPage = useMenuItemsStore((state) => state.hasNextPage)
  const isLoading = useMenuItemsStore((state) => state.isLoading)
  const isSaving = useMenuItemsStore((state) => state.isSaving)
  const error = useMenuItemsStore((state) => state.error)
  const successMessage = useMenuItemsStore((state) => state.successMessage)
  const selectedMenuItem = useMenuItemsStore((state) => state.selectedMenuItem)
  const setSearchQuery = useMenuItemsStore((state) => state.setSearchQuery)
  const setMenuIdFilter = useMenuItemsStore((state) => state.setMenuIdFilter)
  const setActiveStatus = useMenuItemsStore((state) => state.setActiveStatus)
  const setEffectiveStatus = useMenuItemsStore((state) => state.setEffectiveStatus)
  const setMenuItemPage = useMenuItemsStore((state) => state.setMenuItemPage)
  const setMenuItemPageSize = useMenuItemsStore((state) => state.setMenuItemPageSize)
  const setSelectedMenuItem = useMenuItemsStore((state) => state.setSelectedMenuItem)
  const fetchMenuItems = useMenuItemsStore((state) => state.fetchMenuItems)
  const createMenuItem = useMenuItemsStore((state) => state.createMenuItem)
  const updateMenuItem = useMenuItemsStore((state) => state.updateMenuItem)
  const activateMenuItem = useMenuItemsStore((state) => state.activateMenuItem)
  const deactivateMenuItem = useMenuItemsStore((state) => state.deactivateMenuItem)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [menus, setMenus] = useState<Menu[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)

  useEffect(() => {
    if (!isMenuItemsApiConfigured) return

    const timeoutId = window.setTimeout(() => {
      void fetchMenuItems({
        page: menuItemPage,
        pageSize: menuItemPageSize,
        query: searchQuery,
        menuId: menuIdFilter,
        activeStatus,
        effectiveStatus,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [activeStatus, effectiveStatus, fetchMenuItems, menuIdFilter, menuItemPage, menuItemPageSize, searchQuery])

  useEffect(() => {
    if (!isMenuItemsApiConfigured) return

    const abortController = new AbortController()

    async function fetchReferences() {
      setIsLoadingReferences(true)
      setReferenceError(null)

      try {
        const [loadedMenus, loadedProducts] = await Promise.all([
          getAllMenus(abortController.signal),
          getAllProducts(abortController.signal),
        ])

        setMenus(loadedMenus)
        setProducts(loadedProducts)
        setIsLoadingReferences(false)
      } catch (error) {
        if (isMenusRequestCanceled(error) || isProductsRequestCanceled(error)) return

        setReferenceError(error instanceof Error ? error.message : 'Reference data request failed.')
        setIsLoadingReferences(false)
      }
    }

    void fetchReferences()

    return () => abortController.abort()
  }, [])

  async function handleCreateMenuItem(menuItem: MenuItemDraft) {
    await createMenuItem(menuItem)
    setCreateOpen(false)
  }

  async function handleUpdateMenuItem(menuItem: MenuItemDraft) {
    if (!selectedMenuItem) return

    await updateMenuItem(selectedMenuItem.id, menuItem)
    setEditOpen(false)
  }

  async function handleDeactivateMenuItem() {
    if (!selectedMenuItem) return

    await deactivateMenuItem(selectedMenuItem.id)
    setDeactivateOpen(false)
  }

  function openEditMenuItem(menuItem: MenuItem) {
    setSelectedMenuItem(menuItem)
    setEditOpen(true)
  }

  function openDeactivateMenuItem(menuItem: MenuItem) {
    setSelectedMenuItem(menuItem)
    setDeactivateOpen(true)
  }

  const activeMenuItemsOnPage = menuItems.filter((menuItem) => menuItem.isActive).length
  const availableMenuItemsOnPage = menuItems.filter((menuItem) => menuItem.effectiveIsActive).length

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Menu Items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product placement, display, price, order, and availability per menu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchMenuItems({
              page: menuItemPage,
              pageSize: menuItemPageSize,
              query: searchQuery,
              menuId: menuIdFilter,
              activeStatus,
              effectiveStatus,
            })}
            disabled={isLoading || !isMenuItemsApiConfigured}
          >
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isMenuItemsApiConfigured || isLoadingReferences}>
                <Plus className="size-4" />
                New menu item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create menu item</DialogTitle>
                <DialogDescription>
                  Link one product to one menu. ID and timestamps are generated automatically.
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm
                key={createOpen ? 'create-open' : 'create-closed'}
                menus={menus}
                products={products}
                isSaving={isSaving}
                isLoadingReferences={isLoadingReferences}
                submitLabel="Create menu item"
                onSubmit={handleCreateMenuItem}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isMenuItemsApiConfigured && (
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

      {(error || referenceError) && (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardContent className="flex gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{error || referenceError}</p>
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
            <CardDescription>Total menu items</CardDescription>
            <CardTitle className="text-2xl">{totalMenuItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Local active on page</CardDescription>
            <CardTitle className="text-2xl">{activeMenuItemsOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Available on page</CardDescription>
            <CardTitle className="text-2xl">{availableMenuItemsOnPage}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>Menu item records</CardTitle>
            <CardDescription>
              Search matches menu name, product name, kitchen name, and display names before paging.
            </CardDescription>
          </div>
          <div className="w-full xl:w-[620px]">
            <MenuItemSearch
              value={searchQuery}
              menuId={menuIdFilter}
              activeStatus={activeStatus}
              effectiveStatus={effectiveStatus}
              menus={menus}
              onChange={setSearchQuery}
              onMenuIdChange={setMenuIdFilter}
              onActiveStatusChange={setActiveStatus}
              onEffectiveStatusChange={setEffectiveStatus}
              resultCount={menuItems.length}
              totalCount={totalMenuItems}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead>Kitchen name</TableHead>
                <TableHead>Base price</TableHead>
                <TableHead>Sort order</TableHead>
                <TableHead>Local status</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && menuItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading menu items
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && menuItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                    No menu items found.
                  </TableCell>
                </TableRow>
              )}

              {menuItems.map((menuItem) => (
                <TableRow key={menuItem.id}>
                  <TableCell>{menuItem.menuName || '-'}</TableCell>
                  <TableCell>{menuItem.productName || '-'}</TableCell>
                  <TableCell className="font-medium">{menuItem.effectiveDisplayName || '-'}</TableCell>
                  <TableCell>{menuItem.kitchenName || '-'}</TableCell>
                  <TableCell>{formatMenuItemPrice(menuItem.basePricePence)}</TableCell>
                  <TableCell>{menuItem.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={menuItem.isActive ? 'success' : 'secondary'}>
                      {menuItem.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={menuItem.effectiveIsActive ? 'success' : 'warning'}>
                      {menuItem.effectiveIsActive ? 'Available' : 'Unavailable'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditMenuItem(menuItem)}>
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      {menuItem.isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => openDeactivateMenuItem(menuItem)}>
                          <EyeOff className="size-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => void activateMenuItem(menuItem.id)} disabled={isSaving}>
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
            Page {menuItemPage} of {totalPages} - {totalMenuItems} menu items
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows
              <select
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                value={menuItemPageSize}
                onChange={(event) => setMenuItemPageSize(Number(event.target.value))}
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
              onClick={() => setMenuItemPage(menuItemPage - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuItemPage(menuItemPage + 1)}
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
            <DialogTitle>Edit menu item</DialogTitle>
            <DialogDescription>
              Updates relationship fields. ID and created timestamp remain unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedMenuItem && (
            <MenuItemForm
              key={selectedMenuItem.id}
              initialValue={selectedMenuItem}
              menus={menus}
              products={products}
              isSaving={isSaving}
              isLoadingReferences={isLoadingReferences}
              submitLabel="Save changes"
              onSubmit={handleUpdateMenuItem}
            />
          )}
        </DialogContent>
      </Dialog>

      <MenuItemDeactivateDialog
        menuItem={selectedMenuItem}
        open={deactivateOpen}
        isSaving={isSaving}
        onOpenChange={setDeactivateOpen}
        onDeactivate={handleDeactivateMenuItem}
      />
    </div>
  )
}

async function getAllMenus(signal: AbortSignal) {
  const pageSize = 200
  let page = 1
  const menus: Menu[] = []

  for (;;) {
    const result = await getMenus({ page, pageSize, activeStatus: 'all', signal })
    menus.push(...result.menus)

    if (page >= result.pagination.totalPages) break

    page += 1
  }

  return menus
}

async function getAllProducts(signal: AbortSignal) {
  const pageSize = 200
  let page = 1
  const products: Product[] = []

  for (;;) {
    const result = await getProducts({ page, pageSize, activeStatus: 'all', signal })
    products.push(...result.products)

    if (page >= result.pagination.totalPages) break

    page += 1
  }

  return products
}
