import { AlertCircle, CheckCircle2, Edit, Eye, EyeOff, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { isProductsApiConfigured, type Product, type ProductDraft } from '@/apis/products-api'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductSearch } from '@/components/products/ProductSearch'
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
import { useProductsStore } from '@/context/products-store'

export function ProductsPage() {
  const products = useProductsStore((state) => state.products)
  const searchQuery = useProductsStore((state) => state.searchQuery)
  const activeStatus = useProductsStore((state) => state.activeStatus)
  const productPage = useProductsStore((state) => state.productPage)
  const productPageSize = useProductsStore((state) => state.productPageSize)
  const totalProducts = useProductsStore((state) => state.totalProducts)
  const totalPages = useProductsStore((state) => state.totalPages)
  const hasPreviousPage = useProductsStore((state) => state.hasPreviousPage)
  const hasNextPage = useProductsStore((state) => state.hasNextPage)
  const isLoading = useProductsStore((state) => state.isLoading)
  const isSaving = useProductsStore((state) => state.isSaving)
  const error = useProductsStore((state) => state.error)
  const successMessage = useProductsStore((state) => state.successMessage)
  const selectedProduct = useProductsStore((state) => state.selectedProduct)
  const setSearchQuery = useProductsStore((state) => state.setSearchQuery)
  const setActiveStatus = useProductsStore((state) => state.setActiveStatus)
  const setProductPage = useProductsStore((state) => state.setProductPage)
  const setProductPageSize = useProductsStore((state) => state.setProductPageSize)
  const setSelectedProduct = useProductsStore((state) => state.setSelectedProduct)
  const fetchProducts = useProductsStore((state) => state.fetchProducts)
  const createProduct = useProductsStore((state) => state.createProduct)
  const updateProduct = useProductsStore((state) => state.updateProduct)
  const activateProduct = useProductsStore((state) => state.activateProduct)
  const deactivateProduct = useProductsStore((state) => state.deactivateProduct)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!isProductsApiConfigured) return

    const timeoutId = window.setTimeout(() => {
      void fetchProducts({
        page: productPage,
        pageSize: productPageSize,
        query: searchQuery,
        activeStatus,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [activeStatus, fetchProducts, productPage, productPageSize, searchQuery])

  async function handleCreateProduct(product: ProductDraft) {
    await createProduct(product)
    setCreateOpen(false)
  }

  async function handleUpdateProduct(product: ProductDraft) {
    if (!selectedProduct) return

    await updateProduct(selectedProduct.id, product)
    setEditOpen(false)
  }

  async function handleDeactivateProduct() {
    if (!selectedProduct) return

    await deactivateProduct(selectedProduct.id)
    setDeleteOpen(false)
  }

  function openEditProduct(product: Product) {
    setSelectedProduct(product)
    setEditOpen(true)
  }

  function openDeactivateProduct(product: Product) {
    setSelectedProduct(product)
    setDeleteOpen(true)
  }

  const activeProductsOnPage = products.filter((product) => product.isActive).length

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product records stored in the Google Sheet Products tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchProducts({ page: productPage, pageSize: productPageSize, query: searchQuery, activeStatus })}
            disabled={isLoading || !isProductsApiConfigured}
          >
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isProductsApiConfigured}>
                <Plus className="size-4" />
                New product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create product</DialogTitle>
                <DialogDescription>
                  Product ID and timestamps are generated automatically. Name is required.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                key={createOpen ? 'create-open' : 'create-closed'}
                isSaving={isSaving}
                submitLabel="Create product"
                onSubmit={handleCreateProduct}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isProductsApiConfigured && (
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
            <CardDescription>Total products</CardDescription>
            <CardTitle className="text-2xl">{totalProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active on page</CardDescription>
            <CardTitle className="text-2xl">{activeProductsOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>API status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant={isProductsApiConfigured ? 'success' : 'warning'}>
                {isProductsApiConfigured ? 'Configured' : 'Missing env'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Product records</CardTitle>
            <CardDescription>
              Search matches product name and kitchen name before the current page is returned.
            </CardDescription>
          </div>
          <div className="w-full lg:w-[420px]">
            <ProductSearch
              value={searchQuery}
              activeStatus={activeStatus}
              onChange={setSearchQuery}
              onActiveStatusChange={setActiveStatus}
              resultCount={products.length}
              totalCount={totalProducts}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kitchen name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading products
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}

              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name || 'Unnamed product'}</TableCell>
                  <TableCell>{product.kitchenName || '-'}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'success' : 'secondary'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{product.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditProduct(product)}>
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      {product.isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => openDeactivateProduct(product)}>
                          <EyeOff className="size-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => void activateProduct(product.id)} disabled={isSaving}>
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
            Page {productPage} of {totalPages} - {totalProducts} products
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows
              <select
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                value={productPageSize}
                onChange={(event) => setProductPageSize(Number(event.target.value))}
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
              onClick={() => setProductPage(productPage - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductPage(productPage + 1)}
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
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>
              Updates editable product fields. ID and created timestamp remain unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              key={selectedProduct.id}
              initialValue={selectedProduct}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateProduct}
            />
          )}
        </DialogContent>
      </Dialog>

      <ProductDeleteDialog
        product={selectedProduct}
        open={deleteOpen}
        isSaving={isSaving}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeactivateProduct}
      />
    </div>
  )
}
