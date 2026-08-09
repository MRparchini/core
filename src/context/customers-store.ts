import { create } from 'zustand'

import {
  createCustomer as createCustomerRequest,
  deleteCustomer as deleteCustomerRequest,
  getCustomers as getCustomersRequest,
  updateCustomer as updateCustomerRequest,
  type Customer,
  type CustomerDraft,
  type CustomerUpdate,
} from '@/apis/customers-api'

interface CustomersState {
  customers: Customer[]
  selectedCustomer: Customer | null
  searchQuery: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  setSearchQuery: (searchQuery: string) => void
  setSelectedCustomer: (customer: Customer | null) => void
  fetchCustomers: () => Promise<void>
  createCustomer: (customer: CustomerDraft) => Promise<void>
  updateCustomer: (id: string, customer: CustomerUpdate) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected customer request error.'
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  selectedCustomer: null,
  searchQuery: '',
  isLoading: false,
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
        selectedCustomer: null,
        isSaving: false,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error), isSaving: false })
      throw error
    }
  },
}))
