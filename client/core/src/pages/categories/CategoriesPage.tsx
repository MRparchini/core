import { AlertCircle, CheckCircle2, Edit, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { isCategoriesApiConfigured, type Category, type CategoryDraft } from '@/apis/categories-api'
import { CategoryDeleteDialog } from '@/components/categories/CategoryDeleteDialog'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { CategorySearch } from '@/components/categories/CategorySearch'
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
import { useCategoriesStore } from '@/context/categories-store'

export function CategoriesPage() {
  const categories = useCategoriesStore((state) => state.categories)
  const searchQuery = useCategoriesStore((state) => state.searchQuery)
  const categoryPage = useCategoriesStore((state) => state.categoryPage)
  const categoryPageSize = useCategoriesStore((state) => state.categoryPageSize)
  const totalCategories = useCategoriesStore((state) => state.totalCategories)
  const totalPages = useCategoriesStore((state) => state.totalPages)
  const hasPreviousPage = useCategoriesStore((state) => state.hasPreviousPage)
  const hasNextPage = useCategoriesStore((state) => state.hasNextPage)
  const isLoading = useCategoriesStore((state) => state.isLoading)
  const isSaving = useCategoriesStore((state) => state.isSaving)
  const error = useCategoriesStore((state) => state.error)
  const successMessage = useCategoriesStore((state) => state.successMessage)
  const selectedCategory = useCategoriesStore((state) => state.selectedCategory)
  const setSearchQuery = useCategoriesStore((state) => state.setSearchQuery)
  const setCategoryPage = useCategoriesStore((state) => state.setCategoryPage)
  const setCategoryPageSize = useCategoriesStore((state) => state.setCategoryPageSize)
  const setSelectedCategory = useCategoriesStore((state) => state.setSelectedCategory)
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories)
  const createCategory = useCategoriesStore((state) => state.createCategory)
  const updateCategory = useCategoriesStore((state) => state.updateCategory)
  const deleteCategory = useCategoriesStore((state) => state.deleteCategory)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!isCategoriesApiConfigured) return

    const timeoutId = window.setTimeout(() => {
      void fetchCategories({
        page: categoryPage,
        pageSize: categoryPageSize,
        query: searchQuery,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [categoryPage, categoryPageSize, fetchCategories, searchQuery])

  async function handleCreateCategory(category: CategoryDraft) {
    await createCategory(category)
    setCreateOpen(false)
  }

  async function handleUpdateCategory(category: CategoryDraft) {
    if (!selectedCategory) return

    await updateCategory(selectedCategory.id, category)
    setEditOpen(false)
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return

    await deleteCategory(selectedCategory.id)
    setDeleteOpen(false)
  }

  function openEditCategory(category: Category) {
    setSelectedCategory(category)
    setEditOpen(true)
  }

  function openDeleteCategory(category: Category) {
    setSelectedCategory(category)
    setDeleteOpen(true)
  }

  const applyToAllOnPage = categories.filter((category) => category.applyColorToAllItems).length

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage category records stored in the Google Sheet Categories tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchCategories({ page: categoryPage, pageSize: categoryPageSize, query: searchQuery })}
            disabled={isLoading || !isCategoriesApiConfigured}
          >
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isCategoriesApiConfigured}>
                <Plus className="size-4" />
                New category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create category</DialogTitle>
                <DialogDescription>
                  Category ID is generated automatically. Name is required.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                key={createOpen ? 'create-open' : 'create-closed'}
                isSaving={isSaving}
                submitLabel="Create category"
                onSubmit={handleCreateCategory}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isCategoriesApiConfigured && (
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
            <CardDescription>Total categories</CardDescription>
            <CardTitle className="text-2xl">{totalCategories}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Apply to all on page</CardDescription>
            <CardTitle className="text-2xl">{applyToAllOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>API status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant={isCategoriesApiConfigured ? 'success' : 'warning'}>
                {isCategoriesApiConfigured ? 'Configured' : 'Missing env'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Category records</CardTitle>
            <CardDescription>
              Search matches category name and color before the current page is returned.
            </CardDescription>
          </div>
          <div className="w-full lg:w-[420px]">
            <CategorySearch
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={categories.length}
              totalCount={totalCategories}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>ApplyColorToAllItems</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading categories
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}

              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name || 'Unnamed category'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-5 rounded border"
                        style={{ backgroundColor: category.color || 'transparent' }}
                      />
                      <span>{category.color || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.applyColorToAllItems ? 'success' : 'secondary'}>
                      {category.applyColorToAllItems ? 'True' : 'False'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCategory(category)}>
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteCategory(category)}>
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
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Page {categoryPage} of {totalPages} - {totalCategories} categories
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows
              <select
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                value={categoryPageSize}
                onChange={(event) => setCategoryPageSize(Number(event.target.value))}
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
              onClick={() => setCategoryPage(categoryPage - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryPage(categoryPage + 1)}
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
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Updates editable category fields. ID remains unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm
              key={selectedCategory.id}
              initialValue={selectedCategory}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateCategory}
            />
          )}
        </DialogContent>
      </Dialog>

      <CategoryDeleteDialog
        category={selectedCategory}
        open={deleteOpen}
        isSaving={isSaving}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeleteCategory}
      />
    </div>
  )
}
