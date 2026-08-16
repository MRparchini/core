import { create } from 'zustand'

import {
  activateMenu as activateMenuRequest,
  createMenu as createMenuRequest,
  deactivateMenu as deactivateMenuRequest,
  getMenus as getMenusRequest,
  isMenusRequestCanceled,
  updateMenu as updateMenuRequest,
  type Menu,
  type MenuActiveStatus,
  type MenuDraft,
  type MenuUpdate,
} from '@/apis/menus-api'

interface MenusState {
  menus: Menu[]
  selectedMenu: Menu | null
  searchQuery: string
  activeStatus: MenuActiveStatus
  menuPage: number
  menuPageSize: number
  totalMenus: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
  setSearchQuery: (searchQuery: string) => void
  setActiveStatus: (activeStatus: MenuActiveStatus) => void
  setMenuPage: (page: number) => void
  setMenuPageSize: (pageSize: number) => void
  setSelectedMenu: (menu: Menu | null) => void
  fetchMenus: (options?: { page?: number; pageSize?: number; query?: string; activeStatus?: MenuActiveStatus }) => Promise<void>
  createMenu: (menu: MenuDraft) => Promise<void>
  updateMenu: (id: string, menu: MenuUpdate) => Promise<void>
  activateMenu: (id: string) => Promise<void>
  deactivateMenu: (id: string) => Promise<void>
}

let latestMenusRequestId = 0
let activeMenusAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected menu request error.'
}

function startMenusRequest() {
  latestMenusRequestId += 1
  activeMenusAbortController?.abort()

  const requestId = latestMenusRequestId
  const abortController = new AbortController()
  activeMenusAbortController = abortController

  return { abortController, requestId }
}

function finishMenusRequest(abortController: AbortController) {
  if (activeMenusAbortController === abortController) {
    activeMenusAbortController = null
  }
}

export const useMenusStore = create<MenusState>((set, get) => ({
  menus: [],
  selectedMenu: null,
  searchQuery: '',
  activeStatus: 'active',
  menuPage: 1,
  menuPageSize: 50,
  totalMenus: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, menuPage: 1 }),
  setActiveStatus: (activeStatus) => set({ activeStatus, menuPage: 1 }),
  setMenuPage: (menuPage) => set({ menuPage: Math.max(1, menuPage) }),
  setMenuPageSize: (menuPageSize) => set({ menuPageSize, menuPage: 1 }),
  setSelectedMenu: (selectedMenu) => set({ selectedMenu }),

  fetchMenus: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.menuPage
    const pageSize = options.pageSize ?? state.menuPageSize
    const query = options.query ?? state.searchQuery
    const activeStatus = options.activeStatus ?? state.activeStatus
    const { abortController, requestId } = startMenusRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestMenusRequestId &&
        page === currentState.menuPage &&
        pageSize === currentState.menuPageSize &&
        query === currentState.searchQuery &&
        activeStatus === currentState.activeStatus
      )
    }

    set({ isLoading: true })

    try {
      const result = await getMenusRequest({
        page,
        pageSize,
        query,
        activeStatus,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        menus: result.menus,
        menuPage: result.pagination.page,
        menuPageSize: result.pagination.pageSize,
        totalMenus: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isMenusRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishMenusRequest(abortController)
    }
  },

  createMenu: async (menu) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await createMenuRequest(menu)
      set({ isSaving: false, successMessage: 'Menu created.' })
      await get().fetchMenus({ page: get().menuPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateMenu: async (id, menu) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      const updatedMenu = await updateMenuRequest(id, menu)
      set((state) => ({
        menus: state.menus.map((currentMenu) =>
          currentMenu.id === id ? updatedMenu : currentMenu,
        ),
        selectedMenu: null,
        isSaving: false,
        successMessage: 'Menu updated.',
      }))
      await get().fetchMenus({ page: get().menuPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  activateMenu: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await activateMenuRequest(id)
      set({ selectedMenu: null, isSaving: false, successMessage: 'Menu activated.' })
      await get().fetchMenus({ page: get().menuPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deactivateMenu: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await deactivateMenuRequest(id)
      set({ selectedMenu: null, isSaving: false, successMessage: 'Menu deactivated.' })
      await get().fetchMenus({ page: get().menuPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
