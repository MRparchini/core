import axios from 'axios'

export interface Category {
  id: string
  name: string
  color: string
  applyColorToAllItems: boolean
}

export type CategoryDraft = Pick<Category, 'name' | 'color' | 'applyColorToAllItems'>
export type CategoryUpdate = Partial<CategoryDraft>

export interface CategoriesQuery {
  page?: number
  pageSize?: number
  query?: string
  signal?: AbortSignal
}

export interface CategoryPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CategoriesResult {
  categories: Category[]
  pagination: CategoryPagination
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
  pagination?: CategoryPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const categoriesApiTimeoutMs = Number(
  import.meta.env.VITE_CATEGORIES_API_TIMEOUT_MS ||
    import.meta.env.VITE_PRODUCTS_API_TIMEOUT_MS ||
    import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS ||
    30000,
)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl

const categoriesClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: categoriesApiTimeoutMs,
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
    throw new Error(response.message || 'Category API request failed.')
  }

  return response.data
}

export const isCategoriesApiConfigured = Boolean(appsScriptUrl)

export function isCategoriesRequestCanceled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export async function getCategories({
  page = 1,
  pageSize = 50,
  query = '',
  signal,
}: CategoriesQuery = {}): Promise<CategoriesResult> {
  assertConfigured()

  const response = await categoriesClient.get<ApiResponse<Category[]>>('', {
    signal,
    params: {
      service: 'category',
      action: 'getAll',
      page,
      pageSize,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...apiKeyParams(),
    },
  })

  const categories = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      categories,
      pagination: response.data.pagination,
    }
  }

  const filteredCategories = filterCategoriesFallback(categories, query)
  const fallbackTotal = response.data.total ?? (query.trim() ? filteredCategories.length : response.data.count ?? filteredCategories.length)
  const totalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    categories: filteredCategories.slice(startIndex, startIndex + pageSize),
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

function filterCategoriesFallback(categories: Category[], query: string) {
  const normalizedQuery = normalizeCategorySearchText(query)
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  return categories.filter((category) => {
    if (!normalizedQuery) return true

    const normalizedSearchableText = normalizeCategorySearchText([
      category.name,
      category.color,
    ].join(' '))

    return (
      normalizedSearchableText.includes(normalizedQuery) ||
      tokens.every((token) => normalizedSearchableText.includes(token))
    )
  })
}

function normalizeCategorySearchText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getCategoryById(id: string) {
  assertConfigured()

  const response = await categoriesClient.get<ApiResponse<Category>>('', {
    params: {
      service: 'category',
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createCategory(category: CategoryDraft) {
  assertConfigured()

  const response = await categoriesClient.post<ApiResponse<Category>>(
    '',
    JSON.stringify({
      service: 'category',
      action: 'create',
      category,
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

export async function updateCategory(id: string, category: CategoryUpdate) {
  assertConfigured()

  const response = await categoriesClient.post<ApiResponse<Category>>(
    '',
    JSON.stringify({
      service: 'category',
      action: 'update',
      id,
      category,
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

export async function deleteCategory(id: string) {
  assertConfigured()

  const response = await categoriesClient.post<ApiResponse<Category>>(
    '',
    JSON.stringify({
      service: 'category',
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
