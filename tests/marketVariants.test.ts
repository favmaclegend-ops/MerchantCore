import { beforeEach, describe, expect, it } from 'vitest'
import type { MarketStoreProduct } from '@/pages/market/demoMarketStore'
import { marketData, marketStore } from '@/pages/market/demoMarketStore'
import { getProductImages } from '@/pages/market/market'
import {
  addToMarketCart,
  buildMarketCartItem,
  marketCartStore,
  removeFromMarketCart,
  updateMarketCartQuantity,
} from '@/pages/market/cart'

const base: MarketStoreProduct = {
  group_id: 'grp',
  product_id: 'mc_test-v1',
  product_name: 'Shirt',
  product_rating: '0',
  inStock: true,
  shop_name: 'Shop A',
  product_price: '40',
  category: 'Fashion',
  productImageUrl: 'https://img/primary.png',
}

const withVariants: MarketStoreProduct = {
  ...base,
  variants: [
    { size: 'M', color: 'Red', image: 'https://img/red.png' },
    { size: 'L', color: 'Blue' },
  ],
}

beforeEach(() => {
  marketCartStore.setState({ items: [] })
})

describe('getProductImages', () => {
  it('returns the primary image when no variants exist', () => {
    expect(getProductImages(base)).toEqual(['https://img/primary.png'])
  })

  it('appends variant images without duplicating the base gallery', () => {
    const product: MarketStoreProduct = {
      ...base,
      productImages: ['https://img/primary.png'],
      variants: [
        { size: 'M', image: 'https://img/red.png' },
        { size: 'L', image: 'https://img/primary.png' },
      ],
    }
    expect(getProductImages(product)).toEqual([
      'https://img/primary.png',
      'https://img/red.png',
    ])
  })
})

describe('variant cart lines', () => {
  it('builds a cart item carrying the selected variant', () => {
    const item = buildMarketCartItem(withVariants, marketStore.getState().shops, 1)
    expect(item.variant_id).toBe(`${withVariants.product_id}::1`)
    expect(item.variant).toEqual({ size: 'L', color: 'Blue' })
  })

  it('defaults to the first variant when no index is given', () => {
    const item = buildMarketCartItem(withVariants, marketStore.getState().shops)
    expect(item.variant_id).toBe(`${withVariants.product_id}::0`)
    expect(item.variant).toEqual({ size: 'M', color: 'Red' })
  })

  it('adds each variant as its own cart line', () => {
    addToMarketCart(withVariants, 1, 0)
    addToMarketCart(withVariants, 1, 1)
    addToMarketCart(withVariants, 1, 0)
    const { items } = marketCartStore.getState()
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.variant_id?.endsWith('::0'))?.quantity).toBe(2)
    expect(items.find((i) => i.variant_id?.endsWith('::1'))?.quantity).toBe(1)
  })

  it('updates and removes a specific variant line without touching others', () => {
    addToMarketCart(withVariants, 1, 0)
    addToMarketCart(withVariants, 1, 1)
    const { items } = marketCartStore.getState()
    const secondKey = items.find((i) => i.variant_id?.endsWith('::1'))!.variant_id!
    updateMarketCartQuantity(secondKey, 1)
    expect(marketCartStore.getState().items.find((i) => i.variant_id === secondKey)?.quantity).toBe(2)
    removeFromMarketCart(secondKey)
    expect(marketCartStore.getState().items.find((i) => i.variant_id === secondKey)).toBeUndefined()
    expect(marketCartStore.getState().items).toHaveLength(1)
  })

  it('adds a variant product even when the plain product_id is already present', () => {
    addToMarketCart(base)
    addToMarketCart(withVariants, 1, 0)
    const { items } = marketCartStore.getState()
    expect(items).toHaveLength(2)
  })
})

describe('seeded demo data', () => {
  it('ships demo products with variants buyers can pick', () => {
    const milk = marketData.products.find((p) => p.group_id === 'sunrise_mart_product1234')
    expect(milk?.variants?.length).toBeGreaterThan(1)
    expect(milk?.variants?.map((v) => v.size)).toContain('500ml')
    const watch = marketData.products.find((p) => p.group_id === 'bugger_bug@20045')
    expect(watch?.variants?.map((v) => v.color)).toContain('Gold')
  })
})
