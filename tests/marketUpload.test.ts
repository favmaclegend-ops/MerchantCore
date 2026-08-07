import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMarketShop,
  getMyShop,
  getOwnerKey,
  getUploadedSourceIds,
  loadUserProducts,
  loadUserShops,
  mergeUserMarketData,
  removeProductFromMarket,
  updateMarketProductFromInventory,
  uploadProductsToShop,
  type MarketShopInput,
  type PosSourceProduct,
} from '@/pages/market/marketUpload'
import { marketData, marketStore } from '@/pages/market/demoMarketStore'
import { syncUserMarketData } from '@/pages/market/marketApi'
import { valueFormater } from '@/pages/market/market'

const OWNER = 'user:u_1'

const shopInput: MarketShopInput = {
  shop_name: "Kofi's Corner",
  owner: 'Kofi',
  description: 'Everyday essentials',
  city: 'Accra',
}

const posItems: PosSourceProduct[] = [
  { id: 'p1', name: 'Sugar 1kg', price: 15, stock: 40, category: 'Groceries', image: 'https://img/sugar.png' },
  { id: 'p2', name: 'Milk 1L', price: 22, stock: 0, category: 'Groceries', image: 'https://img/milk.png' },
  { id: 'p3', name: 'Bread', price: 8, stock: 12, category: 'Bakery', image: 'https://img/bread.png' },
]

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getOwnerKey', () => {
  it('uses the org id for organisation members', () => {
    expect(getOwnerKey({ id: 'u1' }, { id: 'm1' }, 'org_1')).toBe('org:org_1')
  })

  it('falls back to the member id when no org id is available', () => {
    expect(getOwnerKey({ id: 'u1' }, { id: 'm1' }, null)).toBe('org:m1')
  })

  it('uses the user id for personal logins', () => {
    expect(getOwnerKey({ id: 'u1' }, null, null)).toBe('user:u1')
  })

  it('falls back to email then guest for anonymous users', () => {
    expect(getOwnerKey({ email: 'a@b.c' }, null, null)).toBe('user:a@b.c')
    expect(getOwnerKey(null, null, null)).toBe('user:guest')
  })
})

describe('createMarketShop', () => {
  it('creates a shop owned by the given key', () => {
    const shop = createMarketShop(OWNER, shopInput)
    expect(shop.shop_name).toBe("Kofi's Corner")
    expect(shop.ownerKey).toBe(OWNER)
    expect(shop.owner).toBe('Kofi')
    expect(shop.rating).toBe('0')
    expect(shop.shop_id).toMatch(/^mc_kofi_s_corner@\d+$/)
    expect(shop.product_id).toMatch(/^mc_kofi_s_corner_products@\d+$/)
    expect(shop.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(shop.location?.city).toBe('Accra')
    expect(loadUserShops()).toHaveLength(1)
  })

  it('defaults missing fields', () => {
    const shop = createMarketShop(OWNER, { shop_name: '  ' })
    expect(shop.owner).toBe('Shop Owner')
    expect(shop.shop_id).toMatch(/^mc_shop@\d+$/)
    expect(shop.shopProfileImage).toBe('/img1.png')
  })

  it('allows multiple shops but getMyShop returns the first owned', () => {
    createMarketShop(OWNER, { shop_name: 'A' })
    createMarketShop('user:other', { shop_name: 'B' })
    expect(getMyShop(OWNER)?.shop_name).toBe('A')
    expect(getMyShop('user:other')?.shop_name).toBe('B')
  })
})

describe('uploadProductsToShop', () => {
  it('throws when the owner has no shop', () => {
    expect(() => uploadProductsToShop(OWNER, posItems)).toThrow(
      'Create a shop before uploading items',
    )
  })

  it('rejects items without an image before they can reach the market', () => {
    createMarketShop(OWNER, shopInput)
    const withBareItem = [
      ...posItems,
      { id: 'p4', name: 'Bare Item', price: 5, stock: 10, category: 'Groceries' },
    ]
    expect(() => uploadProductsToShop(OWNER, withBareItem)).toThrow(
      /Sorry, please select an image for/,
    )
    expect(loadUserProducts()).toHaveLength(0)
  })

  it('uploads items into the shop and maps stock', () => {
    createMarketShop(OWNER, shopInput)
    const added = uploadProductsToShop(OWNER, posItems)
    expect(added).toHaveLength(3)
    const shop = getMyShop(OWNER)!
    expect(loadUserProducts()).toHaveLength(3)
    added.forEach((product, i) => {
      expect(product.ownerKey).toBe(OWNER)
      expect(product.sourceId).toBe(posItems[i].id)
      expect(product.group_id).toBe(shop.product_id)
      expect(product.shop_name).toBe(shop.shop_name)
      expect(product.product_price).toBe(String(posItems[i].price))
      expect(product.inStock).toBe(posItems[i].stock > 0)
    })
    expect(added[1].inStock).toBe(false)
  })

  it('carries the product image and initial rating into the market item', () => {
    createMarketShop(OWNER, shopInput)
    const added = uploadProductsToShop(OWNER, [
      { id: 'img1', name: 'Sugar', price: 15, stock: 10, category: 'Groceries', image: 'https://img/x.png', rating: 4.2 },
    ])
    expect(added[0].productImageUrl).toBe('https://img/x.png')
    expect(added[0].product_rating).toBe('4.2')
    expect(added[0].inStock).toBe(true)
  })

  it('defaults missing rating to 0 so the grid never shows NAN', () => {
    createMarketShop(OWNER, shopInput)
    const added = uploadProductsToShop(OWNER, [
      { id: 'nr1', name: 'Rice', price: 60, stock: 5, category: 'Grains', image: 'https://img/rice.png' },
    ])
    expect(added[0].product_rating).toBe('0')
    expect(valueFormater(added[0].product_rating)).toBe('0')
    expect(valueFormater(added[0].product_rating)).not.toBe('NAN')
  })

  it('dedupes by sourceId so a second upload adds nothing', () => {
    createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, posItems)
    const second = uploadProductsToShop(OWNER, posItems)
    expect(second).toHaveLength(0)
    expect(loadUserProducts()).toHaveLength(3)
    expect(getUploadedSourceIds(OWNER)).toEqual(['p1', 'p2', 'p3'])
  })

  it('only skips sources already uploaded by the same owner', () => {
    createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, [posItems[0]])
    const more = uploadProductsToShop(OWNER, [posItems[0], posItems[2]])
    expect(more).toHaveLength(1)
    expect(more[0].sourceId).toBe('p3')
  })
})

describe('mergeUserMarketData', () => {
  it('returns the base data untouched when there is nothing user-created', () => {
    expect(mergeUserMarketData(marketData)).toBe(marketData)
  })

  it('folds user shops and products into the market data', () => {
    const shop = createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, [posItems[0]])
    const merged = mergeUserMarketData(marketData)
    expect(merged.shops[shop.shop_id].shop_name).toBe("Kofi's Corner")
    expect(merged.products.length).toBe(marketData.products.length + 1)
    const uploaded = merged.products.find((p) => p.sourceId === 'p1')
    expect(uploaded?.shop_name).toBe("Kofi's Corner")
    expect(merged.products[marketData.products.length].sourceId).toBe('p1')
  })
})

describe('removeProductFromMarket', () => {
  it('removes an uploaded product for the owner by sourceId', () => {
    createMarketShop(OWNER, shopInput)
    const [added] = uploadProductsToShop(OWNER, [posItems[0]])
    expect(removeProductFromMarket(OWNER, added.sourceId)).toBe(true)
    expect(loadUserProducts()).toHaveLength(0)
    expect(getUploadedSourceIds(OWNER)).toEqual([])
  })

  it('never removes another owner uploads or unknown ids', () => {
    createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, [posItems[0]])
    createMarketShop('user:other', { shop_name: 'B' })
    uploadProductsToShop('user:other', [posItems[1]])
    expect(removeProductFromMarket('user:other', posItems[0].id)).toBe(false)
    expect(removeProductFromMarket(OWNER, 'nope')).toBe(false)
    expect(loadUserProducts().map((p) => p.sourceId)).toEqual(['p1', 'p2'])
  })

  it('does not touch seeded demo products', () => {
    const seeded = marketData.products[0]
    expect(removeProductFromMarket(OWNER, seeded.product_id)).toBe(false)
    const merged = mergeUserMarketData(marketData)
    expect(merged.products.find((p) => p.product_id === seeded.product_id)).toBeDefined()
  })

  it('keeps unrelated uploads in the merged market after a removal', () => {
    createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, [posItems[0], posItems[2]])
    removeProductFromMarket(OWNER, posItems[0].id)
    const merged = mergeUserMarketData(marketData)
    expect(merged.products.length).toBe(marketData.products.length + 1)
    expect(merged.products.find((p) => p.sourceId === 'p3')).toBeDefined()
    expect(merged.products.find((p) => p.sourceId === 'p1')).toBeUndefined()
  })
})

describe('updateMarketProductFromInventory', () => {
  it('mirrors inventory edits into the uploaded market copy', () => {
    createMarketShop(OWNER, shopInput)
    const [added] = uploadProductsToShop(OWNER, [posItems[0]])
    const ok = updateMarketProductFromInventory(OWNER, added.sourceId, {
      name: 'Sugar 2kg',
      price: 28,
      stock: 3,
      category: 'Groceries',
      image: 'https://img/new.png',
      rating: 4.7,
    })
    expect(ok).toBe(true)
    const stored = loadUserProducts()[0]
    expect(stored.product_name).toBe('Sugar 2kg')
    expect(stored.product_price).toBe('28')
    expect(stored.inStock).toBe(true)
    expect(stored.category).toBe('Groceries')
    expect(stored.productImageUrl).toBe('https://img/new.png')
    expect(stored.product_rating).toBe('4.7')
    expect(stored.product_id).toBe(added.product_id)
  })

  it('flips inStock off when stock hits zero', () => {
    createMarketShop(OWNER, shopInput)
    const [added] = uploadProductsToShop(OWNER, [posItems[0]])
    updateMarketProductFromInventory(OWNER, added.sourceId, {
      name: added.product_name,
      price: Number(added.product_price),
      stock: 0,
      category: added.category,
    })
    expect(loadUserProducts()[0].inStock).toBe(false)
  })

  it('returns false for products the owner never uploaded', () => {
    createMarketShop(OWNER, shopInput)
    uploadProductsToShop(OWNER, [posItems[0]])
    expect(
      updateMarketProductFromInventory(OWNER, 'p_other', {
        name: 'x',
        price: 1,
        stock: 1,
        category: 'y',
      }),
    ).toBe(false)
  })
})

describe('syncUserMarketData', () => {
  it('pushes user-created data into the market store so the hub updates live', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const before = marketStore.getState().products.length
    const shop = createMarketShop(OWNER, shopInput)
    syncUserMarketData()
    expect(marketStore.getState().shops[shop.shop_id]).toBeDefined()
    expect(marketStore.getState().products.length).toBe(before)
    uploadProductsToShop(OWNER, [posItems[0]])
    syncUserMarketData()
    expect(marketStore.getState().products.length).toBe(before + 1)
    expect(marketStore.getState().products.at(-1)?.sourceId).toBe('p1')
  })
})
