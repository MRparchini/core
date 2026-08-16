import { create } from 'zustand'

import {
  activateProduct as activateProductRequest,
  createProduct as createProductRequest,
  deactivateProduct as deactivateProductRequest,
  getProducts as getProductsRequest,
  isProductsRequestCanceled,
  updateProduct as updateProductRequest,
  type Product,
  type ProductActiveStatus,
  type ProductDraft,
  type ProductUpdate,
} from '@/apis/products-api'

interface ProductsState {
  products: Product[]
  selectedProduct: Product | null
  searchQuery: string
  activeStatus: ProductActiveStatus
  productPage: number
  productPageSize: number
  totalProducts: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
  setSearchQuery: (searchQuery: string) => void
  setActiveStatus: (activeStatus: ProductActiveStatus) => void
  setProductPage: (page: number) => void
  setProductPageSize: (pageSize: number) => void
  setSelectedProduct: (product: Product | null) => void
  fetchProducts: (options?: { page?: number; pageSize?: number; query?: string; activeStatus?: ProductActiveStatus }) => Promise<void>
  createProduct: (product: ProductDraft) => Promise<void>
  updateProduct: (id: string, product: ProductUpdate) => Promise<void>
  activateProduct: (id: string) => Promise<void>
  deactivateProduct: (id: string) => Promise<void>
}

let latestProductsRequestId = 0
let activeProductsAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected product request error.'
}

function startProductsRequest() {
  latestProductsRequestId += 1
  activeProductsAbortController?.abort()

  const requestId = latestProductsRequestId
  const abortController = new AbortController()
  activeProductsAbortController = abortController

  return { abortController, requestId }
}

function finishProductsRequest(abortController: AbortController) {
  if (activeProductsAbortController === abortController) {
    activeProductsAbortController = null
  }
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  selectedProduct: null,
  searchQuery: '',
  activeStatus: 'active',
  productPage: 1,
  productPageSize: 50,
  totalProducts: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, productPage: 1 }),
  setActiveStatus: (activeStatus) => set({ activeStatus, productPage: 1 }),
  setProductPage: (productPage) => set({ productPage: Math.max(1, productPage) }),
  setProductPageSize: (productPageSize) => set({ productPageSize, productPage: 1 }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

  fetchProducts: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.productPage
    const pageSize = options.pageSize ?? state.productPageSize
    const query = options.query ?? state.searchQuery
    const activeStatus = options.activeStatus ?? state.activeStatus
    const { abortController, requestId } = startProductsRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestProductsRequestId &&
        page === currentState.productPage &&
        pageSize === currentState.productPageSize &&
        query === currentState.searchQuery &&
        activeStatus === currentState.activeStatus
      )
    }

    set({ isLoading: true })

    try {
      const result = await getProductsRequest({
        page,
        pageSize,
        query,
        activeStatus,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        products: result.products,
        productPage: result.pagination.page,
        productPageSize: result.pagination.pageSize,
        totalProducts: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isProductsRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishProductsRequest(abortController)
    }
  },

  createProduct: async (product) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await createProductRequest(product)
      set({ isSaving: false, successMessage: 'Product created.' })
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateProduct: async (id, product) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      const updatedProduct = await updateProductRequest(id, product)
      set((state) => ({
        products: state.products.map((currentProduct) =>
          currentProduct.id === id ? updatedProduct : currentProduct,
        ),
        selectedProduct: null,
        isSaving: false,
        successMessage: 'Product updated.',
      }))
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  activateProduct: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await activateProductRequest(id)
      set({ selectedProduct: null, isSaving: false, successMessage: 'Product activated.' })
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deactivateProduct: async (id) => {
    set({ isSaving: true, error: null, successMessage: null })

    try {
      await deactivateProductRequest(id)
      set({ selectedProduct: null, isSaving: false, successMessage: 'Product deactivated.' })
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
