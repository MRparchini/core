import type { Customer } from '@/apis/customers-api'

export interface RankedCustomerResult {
  customer: Customer
  score: number
  matchedFields: string[]
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeCompact(value: string) {
  return normalizeText(value).replace(/\s+/g, '')
}

function normalizeTelephone(value: string) {
  return value.replace(/\D/g, '')
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

  if (compactPostcode && compactPostcode === compactQuery) {
    score = addScore(matchedFields, 'postcode', score, 1000)
  } else if (compactPostcode && compactPostcode.includes(compactQuery)) {
    score = addScore(matchedFields, 'postcode', score, 760)
  }

  if (address && address === query) {
    score = addScore(matchedFields, 'address', score, 940)
  } else if (address && query.length >= 4 && address.includes(query)) {
    score = addScore(matchedFields, 'address', score, 900)
  }

  if (telephone && telephoneQuery && telephone === telephoneQuery) {
    score = addScore(matchedFields, 'telephone', score, 860)
  } else if (telephone && telephoneQuery.length >= 4 && telephone.includes(telephoneQuery)) {
    score = addScore(matchedFields, 'telephone', score, 720)
  }

  if (id && id === query) {
    score = addScore(matchedFields, 'id', score, 700)
  } else if (id && id.includes(query)) {
    score = addScore(matchedFields, 'id', score, 420)
  }

  if (name && name === query) {
    score = addScore(matchedFields, 'name', score, 640)
  } else if (name && name.includes(query)) {
    score = addScore(matchedFields, 'name', score, 560)
  }

  if (notes && notes.includes(query)) {
    score = addScore(matchedFields, 'notes', score, 220)
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
      if (second.score !== first.score) return second.score - first.score
      return first.customer.name.localeCompare(second.customer.name)
    })
}
