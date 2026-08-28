/**
 * Demo seeding for Market Chat.
 *
 * Seeds a handful of realistic conversations so the UI can be reviewed before
 * live messaging is wired to the backend. Seeding is safe: it reuses the real
 * market store's shops when available (so names/avatars come from actual data)
 * and only writes into threads that don't already exist, so a user's own
 * conversations are never overwritten.
 */

import { marketStore } from '../demoMarketStore'
import { getThread, seedThread, type ChatMessage } from './chatStore'

interface SeedProfile {
  shopId: string
  shopName: string
  shopImage?: string
  unread?: number
  items: Array<{ text: string; from: 'me' | 'shop'; minutesAgo: number }>
}

function isoMinutesAgo(m: number): string {
  return new Date(Date.now() - m * 60 * 1000).toISOString()
}

function buildMessages(profile: SeedProfile): ChatMessage[] {
  return [...profile.items]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .map((item, i) => ({
      id: `seed-${profile.shopId}-${i}`,
      text: item.text,
      from: item.from,
      sentAt: isoMinutesAgo(item.minutesAgo),
    }))
}

/** Ensure the demo conversations exist. Called once from the Chat list page. */
export function seedDemoChats(): void {
  const storeShops = Object.values(marketStore.getState().shops || {}).filter((s) => s && s.shop_id)
  const firstReal = storeShops[0]

  const profiles: SeedProfile[] = [
    {
      shopId: 'demo-shop-1',
      shopName: 'Kofi Fresh Mart',
      unread: 1,
      items: [
        { text: 'Hello! Welcome to Kofi Fresh Mart 👋 How can we help you today?', from: 'shop', minutesAgo: 26 * 60 },
        { text: 'Hi, do you have Frutel Juice 500ml in stock?', from: 'me', minutesAgo: 25 * 60 },
        { text: 'Yes we do! We have 24 bottles available right now.', from: 'shop', minutesAgo: 24 * 60 },
      ],
    },
    {
      shopId: 'demo-shop-2',
      shopName: 'Amina’s Bakery',
      items: [
        { text: 'Your bread order will be delivered tomorrow by 9am.', from: 'shop', minutesAgo: 5 * 60 },
      ],
    },
  ]

  if (firstReal) {
    profiles.push({
      shopId: firstReal.shop_id,
      shopName: firstReal.shop_name || 'Market Shop',
      shopImage: firstReal.shopProfileImage,
      items: [
        { text: `Thanks for checking out ${firstReal.shop_name}! Ask us anything.`, from: 'shop', minutesAgo: 90 },
        { text: 'Great, I’d like to place an order please.', from: 'me', minutesAgo: 60 },
      ],
    })
  }

  for (const profile of profiles) {
    if (getThread(profile.shopId)) continue
    seedThread(
      {
        shopId: profile.shopId,
        shopName: profile.shopName,
        shopImage: profile.shopImage,
      },
      buildMessages(profile),
      profile.unread ?? 0,
    )
  }
}
