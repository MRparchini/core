import { create } from 'zustand'

import {
  createCustomer as createCustomerRequest,
  deleteCustomer as deleteCustomerRequest,
  getCustomerById as getCustomerByIdRequest,
  getCustomers as getCustomersRequest,
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
  isLoading: boolean
  isProfileLoading: boolean
  isSaving: boolean
  error: string | null
  setSearchQuery: (searchQuery: string) => void
  setSelectedCustomer: (customer: Customer | null) => void
  fetchCustomers: () => Promise<void>
  fetchCustomerById: (id: string) => Promise<void>
  createCustomer: (customer: CustomerDraft) => Promise<void>
  updateCustomer: (id: string, customer: CustomerUpdate) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected customer request error.'
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  currentCustomer: null,
  selectedCustomer: null,
  searchQuery: '',
  isLoading: false,
  isProfileLoading: false,
  isSaving: false,
  error: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),

  fetchCustomers: async () => {
    set({ isLoading: true, error: null })

    try {
      const customers = await getCustomersRequest()
      set({ customers, isLoading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false })
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
          : [...state.customers, customer],
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
      set((state) => ({
        customers: [...state.customers, createdCustomer],
        isSaving: false,
      }))
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
        customers: state.customers.filter((customer) => customer.id !== id),
        currentCustomer: state.currentCustomer?.id === id ? null : state.currentCustomer,
        selectedCustomer: null,
        isSaving: false,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
