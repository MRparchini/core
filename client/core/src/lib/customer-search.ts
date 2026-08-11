import type { Customer } from '@/apis/customers-api'

export interface RankedCustomerResult {
  customer: Customer
  score: number
  matchedFields: string[]
}

function normalizeText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompact(value: string) {
  return normalizeText(value).replace(/\s+/g, '')
}

function normalizeTelephone(value: string) {
  return String(value ?? '').replace(/\D/g, '')
}

function getQueryTokens(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
}

function containsAllTokens(value: string, tokens: string[]) {
  if (tokens.length === 0) return false

  const normalizedValue = normalizeText(value)

  return tokens.every((token) => normalizedValue.includes(token))
}

function addScore(
  matchedFields: Set<string>,
  field: string,
  currentScore: number,
  nextScore: number,
) {
  matchedFields.add(field)
  return Math.max(currentScore, nextScore)
}

export function rankCustomerMatch(customer: Customer, rawQuery: string) {
  const query = normalizeText(rawQuery)

  if (!query) {
    return {
      customer,
      score: 0,
      matchedFields: [],
    }
  }

  const queryTokens = getQueryTokens(rawQuery)
  const compactQuery = normalizeCompact(rawQuery)
  const telephoneQuery = normalizeTelephone(rawQuery)

  const matchedFields = new Set<string>()
  let score = -1

  const id = normalizeText(customer.id)
  const name = normalizeText(customer.name)
  const address = normalizeText(customer.address)
  const compactPostcode = normalizeCompact(customer.postcode)
  const telephone = normalizeTelephone(customer.telephoneNumber)
  const notes = normalizeText(customer.notes)

  // ----------------------------------------------------------
  // POSTCODE
  // CF44 8BB and CF448BB are treated as the same postcode.
  // ----------------------------------------------------------

  if (compactPostcode && compactPostcode === compactQuery) {
    score = addScore(matchedFields, 'postcode', score, 1000)
  } else if (
    compactPostcode &&
    compactQuery.length >= 3 &&
    compactPostcode.includes(compactQuery)
  ) {
    score = addScore(matchedFields, 'postcode', score, 920)
  }

  // ----------------------------------------------------------
  // ADDRESS / HOUSE NUMBER
  //
  // Examples that should match:
  // 22
  // 22 Mary
  // Mary 22
  // Pant Y Fedwen
  // 6 North Ave
  // ----------------------------------------------------------

  if (address && address === query) {
    score = addScore(matchedFields, 'address', score, 980)
  } else if (address && address.includes(query)) {
    score = addScore(matchedFields, 'address', score, 950)
  } else if (address && containsAllTokens(address, queryTokens)) {
    score = addScore(matchedFields, 'address', score, 900)
  }

  // ----------------------------------------------------------
  // TELEPHONE
  // Spaces, hyphens and formatting are ignored.
  // ----------------------------------------------------------

  if (telephone && telephoneQuery && telephone === telephoneQuery) {
    score = addScore(matchedFields, 'telephone', score, 880)
  } else if (
    telephone &&
    telephoneQuery.length >= 4 &&
    telephone.includes(telephoneQuery)
  ) {
    score = addScore(matchedFields, 'telephone', score, 760)
  }

  // ----------------------------------------------------------
  // CUSTOMER ID
  // ----------------------------------------------------------

  if (id && id === query) {
    score = addScore(matchedFields, 'id', score, 820)
  }

  // ----------------------------------------------------------
  // CUSTOMER NAME
  // ----------------------------------------------------------

  if (name && name === query) {
    score = addScore(matchedFields, 'name', score, 720)
  } else if (name && name.includes(query)) {
    score = addScore(matchedFields, 'name', score, 680)
  } else if (name && containsAllTokens(name, queryTokens)) {
    score = addScore(matchedFields, 'name', score, 640)
  }

  // ----------------------------------------------------------
  // NOTES
  // ----------------------------------------------------------

  if (notes && notes.includes(query)) {
    score = addScore(matchedFields, 'notes', score, 250)
  }

  if (score < 0) return null

  return {
    customer,
    score,
    matchedFields: Array.from(matchedFields),
  }
}

export function searchCustomers(customers: Customer[], query: string) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return customers.map((customer) => ({
      customer,
      score: 0,
      matchedFields: [],
    }))
  }

  return customers
    .map((customer) => rankCustomerMatch(customer, trimmedQuery))
    .filter((result): result is RankedCustomerResult => Boolean(result))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score
      }

      return (first.customer.name || '').localeCompare(
        second.customer.name || '',
      )
    })
}
