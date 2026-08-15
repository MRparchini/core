import { create } from 'zustand'

import {
  createProduct as createProductRequest,
  deleteProduct as deleteProductRequest,
  getProducts as getProductsRequest,
  isProductsRequestCanceled,
  updateProduct as updateProductRequest,
  type Product,
  type ProductDraft,
  type ProductUpdate,
} from '@/apis/products-api'

interface ProductsState {
  products: Product[]
  selectedProduct: Product | null
  searchQuery: string
  productPage: number
  productPageSize: number
  totalProducts: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  setSearchQuery: (searchQuery: string) => void
  setProductPage: (page: number) => void
  setProductPageSize: (pageSize: number) => void
  setSelectedProduct: (product: Product | null) => void
  fetchProducts: (options?: { page?: number; pageSize?: number; query?: string }) => Promise<void>
  createProduct: (product: ProductDraft) => Promise<void>
  updateProduct: (id: string, product: ProductUpdate) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
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
  productPage: 1,
  productPageSize: 50,
  totalProducts: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isSaving: false,
  error: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, productPage: 1 }),
  setProductPage: (productPage) => set({ productPage: Math.max(1, productPage) }),
  setProductPageSize: (productPageSize) => set({ productPageSize, productPage: 1 }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

  fetchProducts: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.productPage
    const pageSize = options.pageSize ?? state.productPageSize
    const query = options.query ?? state.searchQuery
    const { abortController, requestId } = startProductsRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestProductsRequestId &&
        page === currentState.productPage &&
        pageSize === currentState.productPageSize &&
        query === currentState.searchQuery
      )
    }

    set({ isLoading: true })

    try {
      const result = await getProductsRequest({
        page,
        pageSize,
        query,
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
    set({ isSaving: true, error: null })

    try {
      await createProductRequest(product)
      set({ isSaving: false })
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateProduct: async (id, product) => {
    set({ isSaving: true, error: null })

    try {
      const updatedProduct = await updateProductRequest(id, product)
      set((state) => ({
        products: state.products.map((currentProduct) =>
          currentProduct.id === id ? updatedProduct : currentProduct,
        ),
        selectedProduct: null,
        isSaving: false,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deleteProduct: async (id) => {
    set({ isSaving: true, error: null })

    try {
      await deleteProductRequest(id)
      set({ selectedProduct: null, isSaving: false })
      await get().fetchProducts({ page: get().productPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
