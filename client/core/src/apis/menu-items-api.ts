import axios from 'axios'

export interface MenuItem {
  id: string
  menuId: string
  productId: string
  displayName: string
  descriptionOverride: string
  basePricePence: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  menuName: string
  menuIsActive: boolean
  productName: string
  kitchenName: string
  productIsActive: boolean
  effectiveDisplayName: string
  effectiveDescription: string
  effectiveIsActive: boolean
}

export type MenuItemDraft = Pick<
  MenuItem,
  'menuId' | 'productId' | 'displayName' | 'descriptionOverride' | 'basePricePence' | 'sortOrder' | 'isActive'
>
export type MenuItemUpdate = Partial<MenuItemDraft>
export type MenuItemActiveStatus = 'all' | 'active' | 'inactive'

export interface MenuItemsQuery {
  page?: number
  pageSize?: number
  query?: string
  menuId?: string
  productId?: string
  activeStatus?: MenuItemActiveStatus
  effectiveStatus?: MenuItemActiveStatus
  signal?: AbortSignal
}

export interface MenuItemPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface MenuItemsResult {
  menuItems: MenuItem[]
  pagination: MenuItemPagination
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
  pagination?: MenuItemPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const menuItemsApiTimeoutMs = Number(
  import.meta.env.VITE_MENU_ITEMS_API_TIMEOUT_MS ||
    import.meta.env.VITE_MENUS_API_TIMEOUT_MS ||
    import.meta.env.VITE_PRODUCTS_API_TIMEOUT_MS ||
    import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS ||
    30000,
)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl

const menuItemsClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: menuItemsApiTimeoutMs,
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
    throw new Error(response.message || 'MenuItems API request failed.')
  }

  return response.data
}

export const isMenuItemsApiConfigured = Boolean(appsScriptUrl)

export function isMenuItemsRequestCanceled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export function formatMenuItemPrice(basePricePence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(basePricePence / 100)
}

export async function getMenuItems({
  page = 1,
  pageSize = 50,
  query = '',
  menuId = '',
  productId = '',
  activeStatus = 'all',
  effectiveStatus = 'all',
  signal,
}: MenuItemsQuery = {}): Promise<MenuItemsResult> {
  assertConfigured()

  const response = await menuItemsClient.get<ApiResponse<MenuItem[]>>('', {
    signal,
    params: {
      service: 'menu-items',
      action: 'getAll',
      page,
      pageSize,
      active: activeStatus,
      effectiveActive: effectiveStatus,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(menuId ? { menuId } : {}),
      ...(productId ? { productId } : {}),
      ...apiKeyParams(),
    },
  })

  const menuItems = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      menuItems,
      pagination: response.data.pagination,
    }
  }

  const total = response.data.total ?? response.data.count ?? menuItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    menuItems,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

export async function getMenuItemById(id: string) {
  assertConfigured()

  const response = await menuItemsClient.get<ApiResponse<MenuItem>>('', {
    params: {
      service: 'menu-items',
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createMenuItem(menuItem: MenuItemDraft) {
  assertConfigured()

  const response = await menuItemsClient.post<ApiResponse<MenuItem>>(
    '',
    JSON.stringify({
      service: 'menu-items',
      action: 'create',
      menuItem,
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

export async function updateMenuItem(id: string, menuItem: MenuItemUpdate) {
  assertConfigured()

  const response = await menuItemsClient.post<ApiResponse<MenuItem>>(
    '',
    JSON.stringify({
      service: 'menu-items',
      action: 'update',
      id,
      menuItem,
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

export async function activateMenuItem(id: string) {
  return setMenuItemActive(id, true)
}

export async function deactivateMenuItem(id: string) {
  return setMenuItemActive(id, false)
}

async function setMenuItemActive(id: string, isActive: boolean) {
  assertConfigured()

  const response = await menuItemsClient.post<ApiResponse<MenuItem>>(
    '',
    JSON.stringify({
      service: 'menu-items',
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
