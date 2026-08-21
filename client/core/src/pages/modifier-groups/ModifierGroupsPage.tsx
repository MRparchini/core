import { AlertCircle, CheckCircle2, Edit, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  isModifierGroupsApiConfigured,
  type ModifierGroup,
  type ModifierGroupDraft,
} from '@/apis/modifier-groups-api'
import { ModifierGroupDeleteDialog } from '@/components/modifier-groups/ModifierGroupDeleteDialog'
import { ModifierGroupForm } from '@/components/modifier-groups/ModifierGroupForm'
import { ModifierGroupSearch } from '@/components/modifier-groups/ModifierGroupSearch'
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
import { useModifierGroupsStore } from '@/context/modifier-groups-store'

export function ModifierGroupsPage() {
  const modifierGroups = useModifierGroupsStore((state) => state.modifierGroups)
  const searchQuery = useModifierGroupsStore((state) => state.searchQuery)
  const modifierGroupPage = useModifierGroupsStore((state) => state.modifierGroupPage)
  const modifierGroupPageSize = useModifierGroupsStore((state) => state.modifierGroupPageSize)
  const totalModifierGroups = useModifierGroupsStore((state) => state.totalModifierGroups)
  const totalPages = useModifierGroupsStore((state) => state.totalPages)
  const hasPreviousPage = useModifierGroupsStore((state) => state.hasPreviousPage)
  const hasNextPage = useModifierGroupsStore((state) => state.hasNextPage)
  const isLoading = useModifierGroupsStore((state) => state.isLoading)
  const isSaving = useModifierGroupsStore((state) => state.isSaving)
  const error = useModifierGroupsStore((state) => state.error)
  const successMessage = useModifierGroupsStore((state) => state.successMessage)
  const selectedModifierGroup = useModifierGroupsStore((state) => state.selectedModifierGroup)
  const setSearchQuery = useModifierGroupsStore((state) => state.setSearchQuery)
  const setModifierGroupPage = useModifierGroupsStore((state) => state.setModifierGroupPage)
  const setModifierGroupPageSize = useModifierGroupsStore((state) => state.setModifierGroupPageSize)
  const setSelectedModifierGroup = useModifierGroupsStore((state) => state.setSelectedModifierGroup)
  const fetchModifierGroups = useModifierGroupsStore((state) => state.fetchModifierGroups)
  const createModifierGroup = useModifierGroupsStore((state) => state.createModifierGroup)
  const updateModifierGroup = useModifierGroupsStore((state) => state.updateModifierGroup)
  const deleteModifierGroup = useModifierGroupsStore((state) => state.deleteModifierGroup)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!isModifierGroupsApiConfigured) return

    const timeoutId = window.setTimeout(() => {
      void fetchModifierGroups({
        page: modifierGroupPage,
        pageSize: modifierGroupPageSize,
        query: searchQuery,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [fetchModifierGroups, modifierGroupPage, modifierGroupPageSize, searchQuery])

  async function handleCreateModifierGroup(modifierGroup: ModifierGroupDraft) {
    await createModifierGroup(modifierGroup)
    setCreateOpen(false)
  }

  async function handleUpdateModifierGroup(modifierGroup: ModifierGroupDraft) {
    if (!selectedModifierGroup) return

    await updateModifierGroup(selectedModifierGroup.id, modifierGroup)
    setEditOpen(false)
  }

  async function handleDeleteModifierGroup() {
    if (!selectedModifierGroup) return

    await deleteModifierGroup(selectedModifierGroup.id)
    setDeleteOpen(false)
  }

  function openEditModifierGroup(modifierGroup: ModifierGroup) {
    setSelectedModifierGroup(modifierGroup)
    setEditOpen(true)
  }

  function openDeleteModifierGroup(modifierGroup: ModifierGroup) {
    setSelectedModifierGroup(modifierGroup)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Modifier Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage modifier group records stored in the Google Sheet ModifierGroups tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchModifierGroups({ page: modifierGroupPage, pageSize: modifierGroupPageSize, query: searchQuery })}
            disabled={isLoading || !isModifierGroupsApiConfigured}
          >
            <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isModifierGroupsApiConfigured}>
                <Plus className="size-4" />
                New modifier group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create modifier group</DialogTitle>
                <DialogDescription>
                  Modifier group ID is generated automatically. Name is required.
                </DialogDescription>
              </DialogHeader>
              <ModifierGroupForm
                key={createOpen ? 'create-open' : 'create-closed'}
                isSaving={isSaving}
                submitLabel="Create modifier group"
                onSubmit={handleCreateModifierGroup}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {!isModifierGroupsApiConfigured && (
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

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total modifier groups</CardDescription>
            <CardTitle className="text-2xl">{totalModifierGroups}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>API status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant={isModifierGroupsApiConfigured ? 'success' : 'warning'}>
                {isModifierGroupsApiConfigured ? 'Configured' : 'Missing env'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Modifier group records</CardTitle>
            <CardDescription>
              Search matches modifier group name before the current page is returned.
            </CardDescription>
          </div>
          <div className="w-full lg:w-[420px]">
            <ModifierGroupSearch
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={modifierGroups.length}
              totalCount={totalModifierGroups}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && modifierGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-28 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading modifier groups
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && modifierGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-28 text-center text-muted-foreground">
                    No modifier groups found.
                  </TableCell>
                </TableRow>
              )}

              {modifierGroups.map((modifierGroup) => (
                <TableRow key={modifierGroup.id}>
                  <TableCell className="font-medium">{modifierGroup.name || 'Unnamed modifier group'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModifierGroup(modifierGroup)}>
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteModifierGroup(modifierGroup)}>
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
            Page {modifierGroupPage} of {totalPages} - {totalModifierGroups} modifier groups
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows
              <select
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                value={modifierGroupPageSize}
                onChange={(event) => setModifierGroupPageSize(Number(event.target.value))}
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
              onClick={() => setModifierGroupPage(modifierGroupPage - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModifierGroupPage(modifierGroupPage + 1)}
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
            <DialogTitle>Edit modifier group</DialogTitle>
            <DialogDescription>
              Updates editable modifier group fields. ID remains unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedModifierGroup && (
            <ModifierGroupForm
              key={selectedModifierGroup.id}
              initialValue={selectedModifierGroup}
              isSaving={isSaving}
              submitLabel="Save changes"
              onSubmit={handleUpdateModifierGroup}
            />
          )}
        </DialogContent>
      </Dialog>

      <ModifierGroupDeleteDialog
        modifierGroup={selectedModifierGroup}
        open={deleteOpen}
        isSaving={isSaving}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeleteModifierGroup}
      />
    </div>
  )
}
