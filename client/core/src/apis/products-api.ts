import axios from 'axios'

export interface Product {
  id: string
  name: string
  kitchenName: string
  category: string
  isActive: boolean
  description: string
  createdAt: string
  updatedAt: string
}

export type ProductDraft = Pick<Product, 'name' | 'kitchenName' | 'category' | 'isActive' | 'description'>
export type ProductUpdate = Partial<ProductDraft>

export interface ProductsQuery {
  page?: number
  pageSize?: number
  query?: string
  signal?: AbortSignal
}

export interface ProductPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ProductsResult {
  products: Product[]
  pagination: ProductPagination
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
  pagination?: ProductPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const productsApiTimeoutMs = Number(
  import.meta.env.VITE_PRODUCTS_API_TIMEOUT_MS ||
    import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS ||
    30000,
)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl

const productsClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: productsApiTimeoutMs,
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
    throw new Error(response.message || 'Product API request failed.')
  }

  return response.data
}

export const isProductsApiConfigured = Boolean(appsScriptUrl)

export function isProductsRequestCanceled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export async function getProducts({
  page = 1,
  pageSize = 50,
  query = '',
  signal,
}: ProductsQuery = {}): Promise<ProductsResult> {
  assertConfigured()

  const response = await productsClient.get<ApiResponse<Product[]>>('', {
    signal,
    params: {
      service: 'products',
      action: 'getAll',
      page,
      pageSize,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...apiKeyParams(),
    },
  })

  const products = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      products,
      pagination: response.data.pagination,
    }
  }

  const filteredProducts = filterProductsFallback(products, query)
  const fallbackTotal = response.data.total ?? (query.trim() ? filteredProducts.length : response.data.count ?? filteredProducts.length)
  const totalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    products: filteredProducts.slice(startIndex, startIndex + pageSize),
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

function filterProductsFallback(products: Product[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query)

  if (!normalizedQuery) return products

  const tokens = normalizedQuery.split(' ').filter(Boolean)

  return products.filter((product) => {
    const normalizedSearchableText = normalizeProductSearchText([
      product.name,
      product.kitchenName,
    ].join(' '))

    return (
      normalizedSearchableText.includes(normalizedQuery) ||
      tokens.every((token) => normalizedSearchableText.includes(token))
    )
  })
}

function normalizeProductSearchText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getProductById(id: string) {
  assertConfigured()

  const response = await productsClient.get<ApiResponse<Product>>('', {
    params: {
      service: 'products',
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createProduct(product: ProductDraft) {
  assertConfigured()

  const response = await productsClient.post<ApiResponse<Product>>(
    '',
    JSON.stringify({
      service: 'products',
      action: 'create',
      product,
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

export async function updateProduct(id: string, product: ProductUpdate) {
  assertConfigured()

  const response = await productsClient.post<ApiResponse<Product>>(
    '',
    JSON.stringify({
      service: 'products',
      action: 'update',
      id,
      product,
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

export async function deleteProduct(id: string) {
  assertConfigured()

  const response = await productsClient.post<ApiResponse<Product>>(
    '',
    JSON.stringify({
      service: 'products',
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
