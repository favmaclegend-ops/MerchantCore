import { useState } from 'react'
import { Minus, Plus, CreditCard, Smartphone, Wallet, History } from 'lucide-react'
import { products } from '@/data/mockData'
import { cn } from '@/lib/utils'

export function POSPage() {
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([
    { id: '1', quantity: 2 },
    { id: '3', quantity: 1 },
  ])
  const [category, setCategory] = useState('All Items')
  const categories = ['All Items', 'Beverages', 'Snacks', 'Grains', 'Toiletries']

  const filteredProducts = category === 'All Items' ? products : products.filter(p => p.category === category || p.category.toLowerCase() === category.toLowerCase())

  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.id)!
    return { ...product, quantity: item.quantity }
  })

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const addToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id)
      if (existing) return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { id, quantity: 1 }]
    })
  }

  return (
    <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">POS Terminal</h1>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn('px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap flex-shrink-0 transition-colors',
              category === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 lg:gap-4">
        <div className="xl:col-span-3 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="h-24 bg-slate-100 flex items-center justify-center relative">
                <span className="text-2xl font-bold text-slate-300">{product.name[0]}</span>
                <span className={cn('absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded',
                  product.status === 'in-stock' && 'bg-emerald-50 text-emerald-700',
                  product.status === 'low-stock' && 'bg-amber-50 text-amber-700',
                  product.status === 'out-of-stock' && 'bg-red-50 text-red-700'
                )}>
                  {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low' : 'Out'}
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-slate-900 truncate">{product.name}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">${product.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => addToCart(product.id)}
                className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={product.status === 'out-of-stock'}
              >
                Add
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Cart</span>
              <span className="text-[10px] text-slate-500">#8921-X</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[200px] lg:max-h-[300px]">
            {cartItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Empty</p>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-600">{item.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">${item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Tax (5%)</span>
              <span className="text-slate-900">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-slate-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 grid grid-cols-2 gap-1.5">
            <button className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
              <Wallet className="w-3 h-3" /> Cash
            </button>
            <button className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
              <CreditCard className="w-3 h-3" /> Card
            </button>
            <button className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
              <Smartphone className="w-3 h-3" /> Mobile
            </button>
            <button className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
              <History className="w-3 h-3" /> Log
            </button>
          </div>

          <div className="px-3 pb-3">
            <button className="w-full py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors">
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
