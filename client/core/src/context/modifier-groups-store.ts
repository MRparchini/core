import { create } from 'zustand'

import {
  createModifierGroup as createModifierGroupRequest,
  deleteModifierGroup as deleteModifierGroupRequest,
  getModifierGroups as getModifierGroupsRequest,
  isModifierGroupsRequestCanceled,
  updateModifierGroup as updateModifierGroupRequest,
  type ModifierGroup,
  type ModifierGroupDraft,
  type ModifierGroupUpdate,
} from '@/apis/modifier-groups-api'

interface ModifierGroupsState {
  modifierGroups: ModifierGroup[]
  selectedModifierGroup: ModifierGroup | null
  searchQuery: string
  modifierGroupPage: number
  modifierGroupPageSize: number
  totalModifierGroups: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
  setSearchQuery: (searchQuery: string) => void
  setModifierGroupPage: (page: number) => void
  setModifierGroupPageSize: (pageSize: number) => void
  setSelectedModifierGroup: (modifierGroup: ModifierGroup | null) => void
  fetchModifierGroups: (options?: { page?: number; pageSize?: number; query?: string }) => Promise<void>
  createModifierGroup: (modifierGroup: ModifierGroupDraft) => Promise<void>
  updateModifierGroup: (id: string, modifierGroup: ModifierGroupUpdate) => Promise<void>
  deleteModifierGroup: (id: string) => Promise<void>
}

let latestModifierGroupsRequestId = 0
let activeModifierGroupsAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected modifier group request error.'
}

function startModifierGroupsRequest() {
  latestModifierGroupsRequestId += 1
  activeModifierGroupsAbortController?.abort()

  const requestId = latestModifierGroupsRequestId
  const abortController = new AbortController()
  activeModifierGroupsAbortController = abortController

  return { abortController, requestId }
}

function finishModifierGroupsRequest(abortController: AbortController) {
  if (activeModifierGroupsAbortController === abortController) {
    activeModifierGroupsAbortController = null
  }
}

export const useModifierGroupsStore = create<ModifierGroupsState>((set, get) => ({
  modifierGroups: [],
  selectedModifierGroup: null,
  searchQuery: '',
  modifierGroupPage: 1,
  modifierGroupPageSize: 50,
  totalModifierGroups: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, modifierGroupPage: 1 }),
  setModifierGroupPage: (modifierGroupPage) => set({ modifierGroupPage: Math.max(1, modifierGroupPage) }),
  setModifierGroupPageSize: (modifierGroupPageSize) => set({ modifierGroupPageSize, modifierGroupPage: 1 }),
  setSelectedModifierGroup: (selectedModifierGroup) => set({ selectedModifierGroup }),

  fetchModifierGroups: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.modifierGroupPage
    const pageSize = options.pageSize ?? state.modifierGroupPageSize
    const query = options.query ?? state.searchQuery
    const { abortController, requestId } = startModifierGroupsRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestModifierGroupsRequestId &&
        page === currentState.modifierGroupPage &&
        pageSize === currentState.modifierGroupPageSize &&
        query === currentState.searchQuery
      )
    }

    set({ isLoading: true })

    try {
      const result = await getModifierGroupsRequest({
        page,
        pageSize,
        query,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        modifierGroups: result.modifierGroups,
        modifierGroupPage: result.pagination.page,
        modifierGroupPageSize: result.pagination.pageSize,
        totalModifierGroups: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isModifierGroupsRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishModifierGroupsRequest(abortController)
    }
  },

  createModifierGroup: async (modifierGroup) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await createModifierGroupRequest(modifierGroup)
      set({ isSaving: false, successMessage: 'Modifier group created.' })
      await get().fetchModifierGroups({ page: get().modifierGroupPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateModifierGroup: async (id, modifierGroup) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      const updatedModifierGroup = await updateModifierGroupRequest(id, modifierGroup)
      set((state) => ({
        modifierGroups: state.modifierGroups.map((currentModifierGroup) =>
          currentModifierGroup.id === id ? updatedModifierGroup : currentModifierGroup,
        ),
        selectedModifierGroup: null,
        isSaving: false,
        successMessage: 'Modifier group updated.',
      }))
      await get().fetchModifierGroups({ page: get().modifierGroupPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deleteModifierGroup: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await deleteModifierGroupRequest(id)
      set({ selectedModifierGroup: null, isSaving: false, successMessage: 'Modifier group deleted.' })
      await get().fetchModifierGroups({ page: get().modifierGroupPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
