import axios from 'axios'

export interface Customer {
  id: string
  code: string
  name: string
  address: string
  postcode: string
  telephoneNumber: string
  notes: string
}

export type CustomerDraft = Omit<Customer, 'id'>
export type CustomerUpdate = Partial<CustomerDraft>

export interface CustomersQuery {
  page?: number
  pageSize?: number
  query?: string
}

export interface CustomerPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CustomersResult {
  customers: Customer[]
  pagination: CustomerPagination
}

interface ApiResponse<T> {
  success: boolean
  code?: number
  message?: string
  count?: number
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
  pagination?: CustomerPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const customersApiTimeoutMs = Number(import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS || 60000)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl


const customersClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: customersApiTimeoutMs,
})

function assertConfigured() {
  if (!appsScriptUrl) {
    throw new Error('VITE_GOOGLE_APPS_SCRIPT_URL is not configured.')
  }
}

function apiKeyParams() {
  return appsScriptApiKey ? { key: appsScriptApiKey } : {}
}

function apiKeyBody() {
  return appsScriptApiKey ? { apiKey: appsScriptApiKey, key: appsScriptApiKey } : {}
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (!response.success) {
    throw new Error(response.message || 'Customer API request failed.')
  }

  return response.data
}

export const isCustomersApiConfigured = Boolean(appsScriptUrl)

export async function getCustomers({ page = 1, pageSize = 50, query = '' }: CustomersQuery = {}) {
  assertConfigured()

  const response = await customersClient.get<ApiResponse<Customer[]>>('', {
    params: {
      action: 'getAll',
      page,
      pageSize,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...apiKeyParams(),
    },
  })

  const customers = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      customers,
      pagination: response.data.pagination,
    }
  }

  const filteredCustomers = filterCustomersFallback(customers, query)
  const fallbackTotal = response.data.total ?? (query.trim() ? filteredCustomers.length : response.data.count ?? filteredCustomers.length)
  const totalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    customers: filteredCustomers.slice(startIndex, startIndex + pageSize),
    pagination: {
      total: fallbackTotal,
      page,
      pageSize,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

function filterCustomersFallback(customers: Customer[], query: string) {
  const normalizedQuery = normalizeCustomerSearchText(query)

  if (!normalizedQuery) return customers

  const tokens = normalizedQuery.split(' ').filter(Boolean)
  const compactQuery = normalizeCustomerSearchCompact(query)
  const telephoneQuery = normalizeCustomerTelephone(query)

  return customers.filter((customer) => {
    const searchableText = [
      customer.id,
      customer.code,
      customer.name,
      customer.address,
      customer.postcode,
      customer.telephoneNumber,
      customer.notes,
    ].join(' ')
    const normalizedSearchableText = normalizeCustomerSearchText(searchableText)

    return (
      normalizedSearchableText.includes(normalizedQuery) ||
      (compactQuery.length >= 3 && normalizeCustomerSearchCompact(customer.postcode).includes(compactQuery)) ||
      (telephoneQuery.length >= 4 && normalizeCustomerTelephone(customer.telephoneNumber).includes(telephoneQuery)) ||
      tokens.every((token) => normalizedSearchableText.includes(token))
    )
  })
}

function normalizeCustomerSearchText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCustomerSearchCompact(value: string) {
  return normalizeCustomerSearchText(value).replace(/\s+/g, '')
}

function normalizeCustomerTelephone(value: string) {
  return String(value ?? '').replace(/\D/g, '')
}

export async function getCustomerById(id: string) {
  assertConfigured()

  const response = await customersClient.get<ApiResponse<Customer>>('', {
    params: {
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createCustomer(customer: CustomerDraft) {
  assertConfigured()

  const response = await customersClient.post<ApiResponse<Customer>>(
    '',
    JSON.stringify({
      action: 'create',
      customer,
      ...apiKeyBody(),
    }),
    {
      params: apiKeyParams(),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    },
  )

  return unwrapResponse(response.data)
}

export async function updateCustomer(id: string, customer: CustomerUpdate) {
  assertConfigured()

  const response = await customersClient.post<ApiResponse<Customer>>(
    '',
    JSON.stringify({
      action: 'update',
      id,
      customer,
      ...apiKeyBody(),
    }),
    {
      params: apiKeyParams(),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    },
  )

  return unwrapResponse(response.data)
}

export async function deleteCustomer(id: string) {
  assertConfigured()

  const response = await customersClient.post<ApiResponse<Customer>>(
    '',
    JSON.stringify({
      action: 'delete',
      id,
      ...apiKeyBody(),
    }),
    {
      params: apiKeyParams(),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    },
  )

  return unwrapResponse(response.data)
}
