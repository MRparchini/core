import axios from 'axios'

export interface Menu {
  id: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MenuDraft = Pick<Menu, 'name' | 'description' | 'sortOrder' | 'isActive'>
export type MenuUpdate = Partial<MenuDraft>
export type MenuActiveStatus = 'all' | 'active' | 'inactive'

export interface MenusQuery {
  page?: number
  pageSize?: number
  query?: string
  activeStatus?: MenuActiveStatus
  signal?: AbortSignal
}

export interface MenuPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface MenusResult {
  menus: Menu[]
  pagination: MenuPagination
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
  pagination?: MenuPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const menusApiTimeoutMs = Number(
  import.meta.env.VITE_MENUS_API_TIMEOUT_MS ||
    import.meta.env.VITE_PRODUCTS_API_TIMEOUT_MS ||
    import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS ||
    30000,
)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl

const menusClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: menusApiTimeoutMs,
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
    throw new Error(response.message || 'Menu API request failed.')
  }

  return response.data
}

export const isMenusApiConfigured = Boolean(appsScriptUrl)

export function isMenusRequestCanceled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export async function getMenus({
  page = 1,
  pageSize = 50,
  query = '',
  activeStatus = 'active',
  signal,
}: MenusQuery = {}): Promise<MenusResult> {
  assertConfigured()

  const response = await menusClient.get<ApiResponse<Menu[]>>('', {
    signal,
    params: {
      service: 'menu',
      action: 'getAll',
      page,
      pageSize,
      active: activeStatus,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...apiKeyParams(),
    },
  })

  const menus = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      menus,
      pagination: response.data.pagination,
    }
  }

  const filteredMenus = filterMenusFallback(menus, query, activeStatus)
  const fallbackTotal = response.data.total ?? (query.trim() ? filteredMenus.length : response.data.count ?? filteredMenus.length)
  const totalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    menus: filteredMenus.slice(startIndex, startIndex + pageSize),
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

function filterMenusFallback(menus: Menu[], query: string, activeStatus: MenuActiveStatus) {
  const normalizedQuery = normalizeMenuSearchText(query)
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  return menus.filter((menu) => {
    if (activeStatus === 'active' && !menu.isActive) return false
    if (activeStatus === 'inactive' && menu.isActive) return false
    if (!normalizedQuery) return true

    const normalizedSearchableText = normalizeMenuSearchText([
      menu.name,
      menu.description,
    ].join(' '))

    return (
      normalizedSearchableText.includes(normalizedQuery) ||
      tokens.every((token) => normalizedSearchableText.includes(token))
    )
  })
}

function normalizeMenuSearchText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getMenuById(id: string) {
  assertConfigured()

  const response = await menusClient.get<ApiResponse<Menu>>('', {
    params: {
      service: 'menu',
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createMenu(menu: MenuDraft) {
  assertConfigured()

  const response = await menusClient.post<ApiResponse<Menu>>(
    '',
    JSON.stringify({
      service: 'menu',
      action: 'create',
      menu,
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

export async function updateMenu(id: string, menu: MenuUpdate) {
  assertConfigured()

  const response = await menusClient.post<ApiResponse<Menu>>(
    '',
    JSON.stringify({
      service: 'menu',
      action: 'update',
      id,
      menu,
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

export async function activateMenu(id: string) {
  return setMenuActive(id, true)
}

export async function deactivateMenu(id: string) {
  return setMenuActive(id, false)
}

async function setMenuActive(id: string, isActive: boolean) {
  assertConfigured()

  const response = await menusClient.post<ApiResponse<Menu>>(
    '',
    JSON.stringify({
      service: 'menu',
      action: isActive ? 'activate' : 'deactivate',
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
