import { create } from 'zustand'

import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  getCategories as getCategoriesRequest,
  isCategoriesRequestCanceled,
  updateCategory as updateCategoryRequest,
  type Category,
  type CategoryDraft,
  type CategoryUpdate,
} from '@/apis/categories-api'

interface CategoriesState {
  categories: Category[]
  selectedCategory: Category | null
  searchQuery: string
  categoryPage: number
  categoryPageSize: number
  totalCategories: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
  setSearchQuery: (searchQuery: string) => void
  setCategoryPage: (page: number) => void
  setCategoryPageSize: (pageSize: number) => void
  setSelectedCategory: (category: Category | null) => void
  fetchCategories: (options?: { page?: number; pageSize?: number; query?: string }) => Promise<void>
  createCategory: (category: CategoryDraft) => Promise<void>
  updateCategory: (id: string, category: CategoryUpdate) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

let latestCategoriesRequestId = 0
let activeCategoriesAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected category request error.'
}

function startCategoriesRequest() {
  latestCategoriesRequestId += 1
  activeCategoriesAbortController?.abort()

  const requestId = latestCategoriesRequestId
  const abortController = new AbortController()
  activeCategoriesAbortController = abortController

  return { abortController, requestId }
}

function finishCategoriesRequest(abortController: AbortController) {
  if (activeCategoriesAbortController === abortController) {
    activeCategoriesAbortController = null
  }
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  categoryPage: 1,
  categoryPageSize: 50,
  totalCategories: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, categoryPage: 1 }),
  setCategoryPage: (categoryPage) => set({ categoryPage: Math.max(1, categoryPage) }),
  setCategoryPageSize: (categoryPageSize) => set({ categoryPageSize, categoryPage: 1 }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  fetchCategories: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.categoryPage
    const pageSize = options.pageSize ?? state.categoryPageSize
    const query = options.query ?? state.searchQuery
    const { abortController, requestId } = startCategoriesRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestCategoriesRequestId &&
        page === currentState.categoryPage &&
        pageSize === currentState.categoryPageSize &&
        query === currentState.searchQuery
      )
    }

    set({ isLoading: true })

    try {
      const result = await getCategoriesRequest({
        page,
        pageSize,
        query,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        categories: result.categories,
        categoryPage: result.pagination.page,
        categoryPageSize: result.pagination.pageSize,
        totalCategories: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isCategoriesRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishCategoriesRequest(abortController)
    }
  },

  createCategory: async (category) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await createCategoryRequest(category)
      set({ isSaving: false, successMessage: 'Category created.' })
      await get().fetchCategories({ page: get().categoryPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateCategory: async (id, category) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      const updatedCategory = await updateCategoryRequest(id, category)
      set((state) => ({
        categories: state.categories.map((currentCategory) =>
          currentCategory.id === id ? updatedCategory : currentCategory,
        ),
        selectedCategory: null,
        isSaving: false,
        successMessage: 'Category updated.',
      }))
      await get().fetchCategories({ page: get().categoryPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deleteCategory: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await deleteCategoryRequest(id)
      set({ selectedCategory: null, isSaving: false, successMessage: 'Category deleted.' })
      await get().fetchCategories({ page: get().categoryPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
