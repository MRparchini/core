import axios from 'axios'

export interface ModifierGroup {
  id: string
  name: string
}

export type ModifierGroupDraft = Pick<ModifierGroup, 'name'>
export type ModifierGroupUpdate = Partial<ModifierGroupDraft>

export interface ModifierGroupsQuery {
  page?: number
  pageSize?: number
  query?: string
  signal?: AbortSignal
}

export interface ModifierGroupPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ModifierGroupsResult {
  modifierGroups: ModifierGroup[]
  pagination: ModifierGroupPagination
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
  pagination?: ModifierGroupPagination
  data: T
}

const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
const appsScriptApiKey = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY as string | undefined
const modifierGroupsApiTimeoutMs = Number(
  import.meta.env.VITE_MODIFIER_GROUPS_API_TIMEOUT_MS ||
    import.meta.env.VITE_PRODUCTS_API_TIMEOUT_MS ||
    import.meta.env.VITE_CUSTOMERS_API_TIMEOUT_MS ||
    30000,
)
const devProxyUrl = '/google-app-script'
const apiBaseUrl = import.meta.env.DEV ? devProxyUrl : appsScriptUrl

const modifierGroupsClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: modifierGroupsApiTimeoutMs,
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
    throw new Error(response.message || 'Modifier group API request failed.')
  }

  return response.data
}

export const isModifierGroupsApiConfigured = Boolean(appsScriptUrl)

export function isModifierGroupsRequestCanceled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export async function getModifierGroups({
  page = 1,
  pageSize = 50,
  query = '',
  signal,
}: ModifierGroupsQuery = {}): Promise<ModifierGroupsResult> {
  assertConfigured()

  const response = await modifierGroupsClient.get<ApiResponse<ModifierGroup[]>>('', {
    signal,
    params: {
      service: 'modifierGroup',
      action: 'getAll',
      page,
      pageSize,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...apiKeyParams(),
    },
  })

  const modifierGroups = unwrapResponse(response.data)

  if (response.data.pagination) {
    return {
      modifierGroups,
      pagination: response.data.pagination,
    }
  }

  const filteredModifierGroups = filterModifierGroupsFallback(modifierGroups, query)
  const fallbackTotal = response.data.total ?? (query.trim() ? filteredModifierGroups.length : response.data.count ?? filteredModifierGroups.length)
  const totalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    modifierGroups: filteredModifierGroups.slice(startIndex, startIndex + pageSize),
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

function filterModifierGroupsFallback(modifierGroups: ModifierGroup[], query: string) {
  const normalizedQuery = normalizeModifierGroupSearchText(query)
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  return modifierGroups.filter((modifierGroup) => {
    if (!normalizedQuery) return true

    const normalizedSearchableText = normalizeModifierGroupSearchText(modifierGroup.name)

    return (
      normalizedSearchableText.includes(normalizedQuery) ||
      tokens.every((token) => normalizedSearchableText.includes(token))
    )
  })
}

function normalizeModifierGroupSearchText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getModifierGroupById(id: string) {
  assertConfigured()

  const response = await modifierGroupsClient.get<ApiResponse<ModifierGroup>>('', {
    params: {
      service: 'modifierGroup',
      action: 'getById',
      id,
      ...apiKeyParams(),
    },
  })

  return unwrapResponse(response.data)
}

export async function createModifierGroup(modifierGroup: ModifierGroupDraft) {
  assertConfigured()

  const response = await modifierGroupsClient.post<ApiResponse<ModifierGroup>>(
    '',
    JSON.stringify({
      service: 'modifierGroup',
      action: 'create',
      modifierGroup,
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

export async function updateModifierGroup(id: string, modifierGroup: ModifierGroupUpdate) {
  assertConfigured()

  const response = await modifierGroupsClient.post<ApiResponse<ModifierGroup>>(
    '',
    JSON.stringify({
      service: 'modifierGroup',
      action: 'update',
      id,
      modifierGroup,
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

export async function deleteModifierGroup(id: string) {
  assertConfigured()

  const response = await modifierGroupsClient.post<ApiResponse<ModifierGroup>>(
    '',
    JSON.stringify({
      service: 'modifierGroup',
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
