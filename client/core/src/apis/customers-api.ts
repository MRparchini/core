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

interface ApiResponse<T> {
  success: boolean
  code?: number
  message?: string
  count?: number
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl


const customersClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 20000,
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

export async function getCustomers() {
  assertConfigured()

  const response = await customersClient.get<ApiResponse<Customer[]>>('', {
    params: {
      action: 'getAll',
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
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
