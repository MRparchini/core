import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { Menu } from '@/apis/menus-api'
import type { MenuItem, MenuItemDraft } from '@/apis/menu-items-api'
import type { Product } from '@/apis/products-api'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface MenuItemFormProps {
  initialValue?: MenuItem
  menus: Menu[]
  products: Product[]
  isSaving: boolean
  isLoadingReferences: boolean
  submitLabel: string
  onSubmit: (menuItem: MenuItemDraft) => Promise<void>
}

interface MenuItemFormData {
  menuId: string
  productId: string
  displayName: string
  descriptionOverride: string
  basePrice: string
  sortOrder: number
  isActive: boolean
}

export function MenuItemForm({
  initialValue,
  menus,
  products,
  isSaving,
  isLoadingReferences,
  submitLabel,
  onSubmit,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>(() => ({
    menuId: initialValue?.menuId ?? '',
    productId: initialValue?.productId ?? '',
    displayName: initialValue?.displayName ?? '',
    descriptionOverride: initialValue?.descriptionOverride ?? '',
    basePrice: initialValue ? (initialValue.basePricePence / 100).toFixed(2) : '',
    sortOrder: initialValue?.sortOrder ?? 0,
    isActive: initialValue?.isActive ?? true,
  }))
  const [priceError, setPriceError] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  const menuOptions = buildMenuOptions(menus, initialValue)
  const productOptions = buildProductOptions(products, initialValue, productSearch, formData.productId)

  function updateField<Field extends keyof MenuItemFormData>(field: Field, value: MenuItemFormData[Field]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const basePricePence = parseGbpToPence(formData.basePrice)

    if (basePricePence === null) {
      setPriceError('Enter a GBP amount with no more than two decimal places.')
      return
    }

    setPriceError(null)
    await onSubmit({
      menuId: formData.menuId,
      productId: formData.productId,
      displayName: formData.displayName.trim(),
      descriptionOverride: formData.descriptionOverride.trim(),
      basePricePence,
      sortOrder: Math.max(0, Math.floor(Number(formData.sortOrder) || 0)),
      isActive: formData.isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <label className="grid gap-2 text-sm font-medium">
          Menu
          <select
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={formData.menuId}
            onChange={(event) => updateField('menuId', event.target.value)}
            disabled={isLoadingReferences}
          >
            <option value="">Select a menu</option>
            {menuOptions.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name || 'Unnamed menu'}{menu.isActive ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Product
          <Input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="Search products by name or kitchen name"
            disabled={isLoadingReferences}
          />
          <select
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={formData.productId}
            onChange={(event) => updateField('productId', event.target.value)}
            disabled={isLoadingReferences}
          >
            <option value="">Select a product</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name || 'Unnamed product'}{product.isActive ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Display name
          <Input
            required
            value={formData.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            placeholder="Customer-facing menu name"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Base price
          <Input
            required
            inputMode="decimal"
            value={formData.basePrice}
            onChange={(event) => updateField('basePrice', event.target.value)}
            placeholder="12.95"
          />
          {priceError && <span className="text-xs text-destructive">{priceError}</span>}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sort order
          <Input
            min={0}
            step={1}
            type="number"
            value={formData.sortOrder}
            onChange={(event) => updateField('sortOrder', Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={formData.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          Active menu item
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Description override
          <textarea
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            value={formData.descriptionOverride}
            onChange={(event) => updateField('descriptionOverride', event.target.value)}
            placeholder="Optional menu-specific description"
          />
        </label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving || isLoadingReferences}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

function parseGbpToPence(value: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return null
  }

  const [pounds, pence = ''] = normalizedValue.split('.')
  const paddedPence = `${pence}00`.slice(0, 2)

  return Number(pounds) * 100 + Number(paddedPence)
}

function buildMenuOptions(menus: Menu[], initialValue?: MenuItem) {
  const options = menus.filter((menu) => menu.isActive || menu.id === initialValue?.menuId)

  if (initialValue?.menuId && !options.some((menu) => menu.id === initialValue.menuId)) {
    options.push({
      id: initialValue.menuId,
      name: initialValue.menuName || 'Inactive menu',
      description: '',
      sortOrder: 0,
      isActive: initialValue.menuIsActive,
      createdAt: '',
      updatedAt: '',
    })
  }

  return options
}

function buildProductOptions(
  products: Product[],
  initialValue: MenuItem | undefined,
  query: string,
  selectedProductId: string,
) {
  const normalizedQuery = normalizeProductOptionSearch(query)
  const options = products.filter((product) => {
    if (!product.isActive && product.id !== initialValue?.productId && product.id !== selectedProductId) {
      return false
    }

    if (!normalizedQuery || product.id === selectedProductId) {
      return true
    }

    const normalizedSearchableText = normalizeProductOptionSearch([
      product.name,
      product.kitchenName,
      product.category,
    ].join(' '))

    return normalizedSearchableText.includes(normalizedQuery)
  })

  if (initialValue?.productId && !options.some((product) => product.id === initialValue.productId)) {
    options.push({
      id: initialValue.productId,
      name: initialValue.productName || 'Inactive product',
      kitchenName: initialValue.kitchenName,
      category: '',
      isActive: initialValue.productIsActive,
      description: '',
      createdAt: '',
      updatedAt: '',
    })
  }

  if (selectedProductId && !options.some((product) => product.id === selectedProductId)) {
    const selectedProduct = products.find((product) => product.id === selectedProductId)

    if (selectedProduct) {
      options.push(selectedProduct)
    }
  }

  return options
}

function normalizeProductOptionSearch(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
