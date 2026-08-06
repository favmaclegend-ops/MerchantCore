import { describe, expect, it } from 'vitest'
import {
  advertTargetUrl,
  BILLBOARD_AD_COUNT,
  pickBillboardAds,
} from '@/pages/market/billboard'
import type { MarketStoreAdvert } from '@/pages/market/demoMarketStore'
import { marketData } from '@/pages/market/demoMarketStore'

const adverts: MarketStoreAdvert[] = marketData.advert ?? []

describe('pickBillboardAds', () => {
  it('returns exactly 3 ads when the pool has at least 3', () => {
    expect(pickBillboardAds(adverts, 3)).toHaveLength(3)
  })

  it('defaults to BILLBOARD_AD_COUNT when count is omitted', () => {
    expect(pickBillboardAds(adverts)).toHaveLength(BILLBOARD_AD_COUNT)
    expect(BILLBOARD_AD_COUNT).toBe(3)
  })

  it('never returns duplicate ads', () => {
    const picked = pickBillboardAds(adverts, BILLBOARD_AD_COUNT)
    const ids = picked.map((ad) => ad.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns every ad when the pool is smaller than the requested count', () => {
    const pool = adverts.slice(0, 2)
    expect(pickBillboardAds(pool, 3)).toHaveLength(2)
  })

  it('returns an empty list for an empty pool', () => {
    expect(pickBillboardAds([], 3)).toEqual([])
  })

  it('does not mutate the input array', () => {
    const pool = adverts.slice()
    pickBillboardAds(pool, 3)
    expect(pool).toEqual(adverts)
  })

  it('is deterministic for a fixed random source', () => {
    const first = pickBillboardAds(adverts, 3, () => 0)
    const second = pickBillboardAds(adverts, 3, () => 0)
    expect(first.map((ad) => ad.id)).toEqual(second.map((ad) => ad.id))
  })

  it('produces different selections for different random sources', () => {
    const orderLow = pickBillboardAds(adverts, 3, () => 0)
      .map((ad) => ad.id)
      .join(',')
    const orderHigh = pickBillboardAds(adverts, 3, () => 0.999)
      .map((ad) => ad.id)
      .join(',')
    expect(orderLow).not.toBe(orderHigh)
  })
})

describe('demo advert pool', () => {
  it('contains at least 3 ads so the billboard can always fill a slot', () => {
    expect(adverts.length).toBeGreaterThanOrEqual(BILLBOARD_AD_COUNT)
  })

  it('gives every advert a video clip for the billboard', () => {
    for (const ad of adverts) {
      expect(ad.videoUrl).toBeTruthy()
    }
  })

  it('gives every advert a visit link target', () => {
    for (const ad of adverts) {
      expect(ad.visitLink.trim()).toBeTruthy()
    }
  })
})

describe('advertTargetUrl', () => {
  it('returns the trimmed visit link when present', () => {
    const ad: MarketStoreAdvert = {
      id: 'ad-1',
      advertUrl: '',
      videoUrl: '',
      visitLink: '  https://example.com  ',
    }
    expect(advertTargetUrl(ad)).toBe('https://example.com')
  })

  it('returns undefined for a blank visit link', () => {
    const ad: MarketStoreAdvert = {
      id: 'ad-1',
      advertUrl: '',
      videoUrl: '',
      visitLink: '   ',
    }
    expect(advertTargetUrl(ad)).toBeUndefined()
  })

  it('returns undefined when given no advert', () => {
    expect(advertTargetUrl(undefined)).toBeUndefined()
  })
})
