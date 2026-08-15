import { create } from 'zustand'

import {
  createCustomer as createCustomerRequest,
  deleteCustomer as deleteCustomerRequest,
  getCustomerById as getCustomerByIdRequest,
  getCustomers as getCustomersRequest,
  isCustomersRequestCanceled,
  updateCustomer as updateCustomerRequest,
  type Customer,
  type CustomerDraft,
  type CustomerUpdate,
} from '@/apis/customers-api'

interface CustomersState {
  customers: Customer[]
  currentCustomer: Customer | null
  selectedCustomer: Customer | null
  searchQuery: string
  customerPage: number
  customerPageSize: number
  totalCustomers: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  isProfileLoading: boolean
  isSaving: boolean
  error: string | null
  setSearchQuery: (searchQuery: string) => void
  setCustomerPage: (page: number) => void
  setCustomerPageSize: (pageSize: number) => void
  setSelectedCustomer: (customer: Customer | null) => void
  fetchCustomers: (options?: { page?: number; pageSize?: number; query?: string }) => Promise<void>
  fetchCustomerById: (id: string) => Promise<void>
  createCustomer: (customer: CustomerDraft) => Promise<void>
  updateCustomer: (id: string, customer: CustomerUpdate) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
}

let latestCustomersRequestId = 0
let activeCustomersAbortController: AbortController | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected customer request error.'
}

function startCustomersRequest() {
  latestCustomersRequestId += 1
  activeCustomersAbortController?.abort()

  const requestId = latestCustomersRequestId
  const abortController = new AbortController()
  activeCustomersAbortController = abortController

  return { abortController, requestId }
}

function finishCustomersRequest(abortController: AbortController) {
  if (activeCustomersAbortController === abortController) {
    activeCustomersAbortController = null
  }
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  currentCustomer: null,
  selectedCustomer: null,
  searchQuery: '',
  customerPage: 1,
  customerPageSize: 50,
  totalCustomers: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  isLoading: false,
  isProfileLoading: false,
  isSaving: false,
  error: null,

  setSearchQuery: (searchQuery) => set({ searchQuery, customerPage: 1 }),
  setCustomerPage: (customerPage) => set({ customerPage: Math.max(1, customerPage) }),
  setCustomerPageSize: (customerPageSize) => set({ customerPageSize, customerPage: 1 }),
  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),

  fetchCustomers: async (options = {}) => {
    const state = get()
    const page = options.page ?? state.customerPage
    const pageSize = options.pageSize ?? state.customerPageSize
    const query = options.query ?? state.searchQuery
    const { abortController, requestId } = startCustomersRequest()

    const isCurrentRequest = () => {
      const currentState = get()

      return (
        requestId === latestCustomersRequestId &&
        page === currentState.customerPage &&
        pageSize === currentState.customerPageSize &&
        query === currentState.searchQuery
      )
    }

    set({ isLoading: true })

    try {
      const result = await getCustomersRequest({
        page,
        pageSize,
        query,
        signal: abortController.signal,
      })

      if (!isCurrentRequest()) return

      set({
        customers: result.customers,
        customerPage: result.pagination.page,
        customerPageSize: result.pagination.pageSize,
        totalCustomers: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasPreviousPage: result.pagination.hasPreviousPage,
        hasNextPage: result.pagination.hasNextPage,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      if (isCustomersRequestCanceled(error) || !isCurrentRequest()) return

      set({ error: getErrorMessage(error), isLoading: false })
    } finally {
      finishCustomersRequest(abortController)
    }
  },

  fetchCustomerById: async (id) => {
    set({ isProfileLoading: true, error: null })

    try {
      const customer = await getCustomerByIdRequest(id)
      set((state) => ({
        currentCustomer: customer,
        customers: state.customers.some((currentCustomer) => currentCustomer.id === customer.id)
          ? state.customers.map((currentCustomer) =>
              currentCustomer.id === customer.id ? customer : currentCustomer,
            )
          : state.customers,
        isProfileLoading: false,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error), isProfileLoading: false })
    }
  },

  createCustomer: async (customer) => {
    set({ isSaving: true, error: null })

    try {
      const createdCustomer = await createCustomerRequest(customer)
      set({ currentCustomer: createdCustomer, isSaving: false })
      await get().fetchCustomers({ page: get().customerPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  updateCustomer: async (id, customer) => {
    set({ isSaving: true, error: null })

    try {
      const updatedCustomer = await updateCustomerRequest(id, customer)
      set((state) => ({
        customers: state.customers.map((currentCustomer) =>
          currentCustomer.id === id ? updatedCustomer : currentCustomer,
        ),
        currentCustomer:
          state.currentCustomer?.id === id ? updatedCustomer : state.currentCustomer,
        selectedCustomer: null,
        isSaving: false,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },

  deleteCustomer: async (id) => {
    set({ isSaving: true, error: null })

    try {
      await deleteCustomerRequest(id)
      set((state) => ({
        currentCustomer: state.currentCustomer?.id === id ? null : state.currentCustomer,
        selectedCustomer: null,
        isSaving: false,
      }))
      await get().fetchCustomers({ page: get().customerPage })
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
