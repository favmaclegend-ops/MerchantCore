import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addToMarketCart,
  buildMarketCartItem,
  clearMarketCart,
  getMarketCartItemKey,
  getMarketCartTotals,
  marketCartStore,
  removeFromMarketCart,
  updateMarketCartQuantity,
  type MarketCartItem,
} from '@/pages/market/cart'
import {
  groupCartItemsByShop,
  marketOrdersStore,
  submitMarketOrder,
} from '@/pages/market/marketApi'
import { marketData, marketStore } from '@/pages/market/demoMarketStore'

const sunriseMilk = marketData.products.find(
  (p) => p.group_id === 'sunrise_mart_product1234',
)!

const megaMalt = marketData.products.find((p) => p.group_id === 'Kolay@00021')!

beforeEach(() => {
  marketCartStore.setState({ items: [] })
  marketOrdersStore.setState({ orders: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildMarketCartItem', () => {
  it('resolves a product to its owning shop by product_id', () => {
    const item = buildMarketCartItem(sunriseMilk, marketStore.getState().shops)
    expect(item.shop_id).toBe('sunrise_mart@123456')
    expect(item.shop_name).toBe('Sunrise Mart')
  })

  it('resolves a product to its owning shop by shop_id', () => {
    const item = buildMarketCartItem(megaMalt, marketStore.getState().shops)
    expect(item.shop_id).toBe('Kolay@00021')
    expect(item.shop_name).toBe('Kolay')
  })
})

describe('addToMarketCart', () => {
  it('adds an item to the cart', () => {
    expect(addToMarketCart(sunriseMilk)).toBe(true)
    const { items } = marketCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product_name).toBe('Fresh Milk')
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when the product is already in the cart', () => {
    addToMarketCart(sunriseMilk)
    addToMarketCart(sunriseMilk)
    const { items } = marketCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('refuses to add an out-of-stock product', () => {
    const soldOut = { ...sunriseMilk, inStock: false }
    expect(addToMarketCart(soldOut)).toBe(false)
    expect(marketCartStore.getState().items).toHaveLength(0)
  })

  it('keeps products from different shops separate', () => {
    addToMarketCart(sunriseMilk)
    addToMarketCart(megaMalt)
    expect(marketCartStore.getState().items).toHaveLength(2)
  })
})

describe('cart quantity helpers', () => {
  it('increments and decrements a quantity', () => {
    addToMarketCart(sunriseMilk)
    const lineKey = getMarketCartItemKey(marketCartStore.getState().items[0])
    updateMarketCartQuantity(lineKey, 1)
    expect(marketCartStore.getState().items[0].quantity).toBe(2)
    updateMarketCartQuantity(lineKey, -1)
    expect(marketCartStore.getState().items[0].quantity).toBe(1)
  })

  it('removes the item when quantity drops to zero', () => {
    addToMarketCart(sunriseMilk)
    updateMarketCartQuantity(
      getMarketCartItemKey(marketCartStore.getState().items[0]),
      -1,
    )
    expect(marketCartStore.getState().items).toHaveLength(0)
  })

  it('removes an item entirely', () => {
    addToMarketCart(sunriseMilk)
    removeFromMarketCart(
      getMarketCartItemKey(marketCartStore.getState().items[0]),
    )
    expect(marketCartStore.getState().items).toHaveLength(0)
  })

  it('clears the whole cart', () => {
    addToMarketCart(sunriseMilk)
    addToMarketCart(megaMalt)
    clearMarketCart()
    expect(marketCartStore.getState().items).toHaveLength(0)
  })
})

describe('getMarketCartTotals', () => {
  it('computes subtotal, 5% tax and total', () => {
    const items: MarketCartItem[] = [
      {
        product_id: 'p1',
        group_id: 'g1',
        shop_id: 's1',
        shop_name: 'Shop A',
        product_name: 'A',
        product_price: '10',
        quantity: 2,
      },
      {
        product_id: 'p2',
        group_id: 'g2',
        shop_id: 's2',
        shop_name: 'Shop B',
        product_name: 'B',
        product_price: '4',
        quantity: 1,
      },
    ]
    const totals = getMarketCartTotals(items)
    expect(totals.subtotal).toBe(24)
    expect(totals.tax).toBeCloseTo(1.2)
    expect(totals.total).toBeCloseTo(25.2)
  })

  it('returns zero totals for an empty cart', () => {
    expect(getMarketCartTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })
})

describe('groupCartItemsByShop', () => {
  it('groups cart items by their owning shop', () => {
    const items: MarketCartItem[] = [
      {
        product_id: 'a',
        group_id: 'g1',
        shop_id: 'sunrise_mart@123456',
        shop_name: 'Sunrise Mart',
        product_name: 'A',
        product_price: '1',
        quantity: 1,
      },
      {
        product_id: 'b',
        group_id: 'g2',
        shop_id: 'sunrise_mart@123456',
        shop_name: 'Sunrise Mart',
        product_name: 'B',
        product_price: '1',
        quantity: 1,
      },
      {
        product_id: 'c',
        group_id: 'g3',
        shop_id: 'Kolay@00021',
        shop_name: 'Kolay',
        product_name: 'C',
        product_price: '1',
        quantity: 1,
      },
    ]
    const groups = groupCartItemsByShop(items)
    expect(Object.keys(groups)).toEqual(['sunrise_mart@123456', 'Kolay@00021'])
    expect(groups['sunrise_mart@123456']).toHaveLength(2)
    expect(groups['Kolay@00021']).toHaveLength(1)
  })
})

describe('submitMarketOrder (demo checkout API)', () => {
  it('rejects an empty cart', async () => {
    await expect(submitMarketOrder({ items: [], payment_method: 'Cash' })).rejects.toThrow(
      'Cannot checkout an empty cart',
    )
  })

  it('returns an order with totals and one alert per owning shop', async () => {
    vi.useFakeTimers()
    const promise = submitMarketOrder({
      items: [
        {
          product_id: 'p1',
          group_id: 'sunrise_mart_product1234',
          shop_id: 'sunrise_mart@123456',
          shop_name: 'Sunrise Mart',
          product_name: 'Fresh Milk',
          product_price: '2.99',
          quantity: 2,
        },
        {
          product_id: 'p2',
          group_id: 'Kolay@00021',
          shop_id: 'Kolay@00021',
          shop_name: 'Kolay',
          product_name: 'Mega Malt',
          product_price: '15',
          quantity: 1,
        },
      ],
      payment_method: 'Card',
    })
    await vi.advanceTimersByTimeAsync(600)
    const result = await promise

    expect(result.order_id).toMatch(/^MC-ORD-/)
    expect(result.payment_method).toBe('Card')
    expect(result.subtotal).toBeCloseTo(20.98)
    expect(result.tax).toBeCloseTo(1.049)
    expect(result.total).toBeCloseTo(22.029)

    expect(result.alerts).toHaveLength(2)
    const sunriseAlert = result.alerts.find((a) => a.shop_id === 'sunrise_mart@123456')!
    expect(sunriseAlert.shop_name).toBe('Sunrise Mart')
    expect(sunriseAlert.owner).toBe('Daniel kofie')
    expect(sunriseAlert.amount).toBeCloseTo(5.98)
    expect(sunriseAlert.message).toContain('2 item(s)')
    expect(sunriseAlert.message).toContain('Fresh Milk')
    expect(sunriseAlert.sentAt).toBe(result.createdAt)
  })

  it('prepends the order to the order log', async () => {
    vi.useFakeTimers()
    const promise = submitMarketOrder({
      items: [
        {
          product_id: 'p1',
          group_id: 'sunrise_mart_product1234',
          shop_id: 'sunrise_mart@123456',
          shop_name: 'Sunrise Mart',
          product_name: 'Fresh Milk',
          product_price: '2.99',
          quantity: 1,
        },
      ],
      payment_method: 'Mobile',
    })
    await vi.advanceTimersByTimeAsync(600)
    const result = await promise

    const { orders } = marketOrdersStore.getState()
    expect(orders).toHaveLength(1)
    expect(orders[0].order_id).toBe(result.order_id)
  })
})
