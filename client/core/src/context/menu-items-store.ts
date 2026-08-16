import { create } from 'zustand'

import {
  activateMenuItem as activateMenuItemRequest,
  createMenuItem as createMenuItemRequest,
  deactivateMenuItem as deactivateMenuItemRequest,
  getMenuItems as getMenuItemsRequest,
  isMenuItemsRequestCanceled,
  updateMenuItem as updateMenuItemRequest,
  type MenuItem,
  type MenuItemActiveStatus,
  type MenuItemDraft,
  type MenuItemUpdate,
} from '@/apis/menu-items-api'

interface MenuItemsState {
  menuItems: MenuItem[]
  selectedMenuItem: MenuItem | null
  searchQuery: string
  menuIdFilter: string
  activeStatus: MenuItemActiveStatus
  effectiveStatus: MenuItemActiveStatus
  menuItemPage: number
  menuItemPageSize: number
  totalMenuItems: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
  setSearchQuery: (searchQuery: string) => void
  setMenuIdFilter: (menuId: string) => void
  setActiveStatus: (activeStatus: MenuItemActiveStatus) => void
  setEffectiveStatus: (effectiveStatus: MenuItemActiveStatus) => void
  setMenuItemPage: (page: number) => void
  setMenuItemPageSize: (pageSize: number) => void
  setSelectedMenuItem: (menuItem: MenuItem | null) => void
  fetchMenuItems: (options?: {
    page?: number
    pageSize?: number
    query?: string
    menuId?: string
    activeStatus?: MenuItemActiveStatus
    effectiveStatus?: MenuItemActiveStatus
  }) => Promise<void>
  createMenuItem: (menuItem: MenuItemDraft) => Promise<void>
  updateMenuItem: (id: string, menuItem: MenuItemUpdate) => Promise<void>
  activateMenuItem: (id: string) => Promise<void>
  deactivateMenuItem: (id: string) => Promise<void>
}

let latestMenuItemsRequestId = 0
let activeMenuItemsAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected menu item request error.'
}

function startMenuItemsRequest() {
  latestMenuItemsRequestId += 1
  activeMenuItemsAbortController?.abort()

  const requestId = latestMenuItemsRequestId
  const abortController = new AbortController()
  activeMenuItemsAbortController = abortController

  return { abortController, requestId }
}

function finishMenuItemsRequest(abortController: AbortController) {
  if (activeMenuItemsAbortController === abortController) {
    activeMenuItemsAbortController = null
  }
}

export const useMenuItemsStore = create<MenuItemsState>((set, get) => ({
  menuItems: [],
  selectedMenuItem: null,
  searchQuery: '',
  menuIdFilter: '',
  activeStatus: 'all',
  effectiveStatus: 'all',
  menuItemPage: 1,
  menuItemPageSize: 50,
  totalMenuItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, menuItemPage: 1 }),
  setMenuIdFilter: (menuIdFilter) => set({ menuIdFilter, menuItemPage: 1 }),
  setActiveStatus: (activeStatus) => set({ activeStatus, menuItemPage: 1 }),
  setEffectiveStatus: (effectiveStatus) => set({ effectiveStatus, menuItemPage: 1 }),
  setMenuItemPage: (menuItemPage) => set({ menuItemPage: Math.max(1, menuItemPage) }),
  setMenuItemPageSize: (menuItemPageSize) => set({ menuItemPageSize, menuItemPage: 1 }),
  setSelectedMenuItem: (selectedMenuItem) => set({ selectedMenuItem }),

  fetchMenuItems: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.menuItemPage
    const pageSize = options.pageSize ?? state.menuItemPageSize
    const query = options.query ?? state.searchQuery
    const menuId = options.menuId ?? state.menuIdFilter
    const activeStatus = options.activeStatus ?? state.activeStatus
    const effectiveStatus = options.effectiveStatus ?? state.effectiveStatus
    const { abortController, requestId } = startMenuItemsRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestMenuItemsRequestId &&
        page === currentState.menuItemPage &&
        pageSize === currentState.menuItemPageSize &&
        query === currentState.searchQuery &&
        menuId === currentState.menuIdFilter &&
        activeStatus === currentState.activeStatus &&
        effectiveStatus === currentState.effectiveStatus
      )
    }

    set({ isLoading: true })

    try {
      const result = await getMenuItemsRequest({
        page,
        pageSize,
        query,
        menuId,
        activeStatus,
        effectiveStatus,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        menuItems: result.menuItems,
        menuItemPage: result.pagination.page,
        menuItemPageSize: result.pagination.pageSize,
        totalMenuItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isMenuItemsRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishMenuItemsRequest(abortController)
    }
  },

  createMenuItem: async (menuItem) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await createMenuItemRequest(menuItem)
      set({ isSaving: false, successMessage: 'Menu item created.' })
      await get().fetchMenuItems({ page: get().menuItemPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateMenuItem: async (id, menuItem) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await updateMenuItemRequest(id, menuItem)
      set({ selectedMenuItem: null, isSaving: false, successMessage: 'Menu item updated.' })
      await get().fetchMenuItems({ page: get().menuItemPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  activateMenuItem: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await activateMenuItemRequest(id)
      set({ selectedMenuItem: null, isSaving: false, successMessage: 'Menu item activated.' })
      await get().fetchMenuItems({ page: get().menuItemPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deactivateMenuItem: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await deactivateMenuItemRequest(id)
      set({ selectedMenuItem: null, isSaving: false, successMessage: 'Menu item deactivated.' })
      await get().fetchMenuItems({ page: get().menuItemPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
