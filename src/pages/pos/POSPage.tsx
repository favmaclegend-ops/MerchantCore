import { useEffect, useState } from 'react'
import { Minus, Plus, CreditCard, Smartphone, Wallet, History, CheckCircle } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export function POSPage() {
  const bp = useBreakpoint()
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState('All Items')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [showLog, setShowLog] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    api.getProducts().then(p => setProducts(p)).catch(() => {}).finally(() => setLoadingProducts(false))
  }, [])

  const categories = ['All Items', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = category === 'All Items' ? products : products.filter(p => p.category === category)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
      const product = products.find(p => p.id === id)
      if (!product) return prev
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || checkingOut) return
    setCheckingOut(true)
    try {
      await api.checkout({ items: cart, total, payment_method: paymentMethod })
      setCart([])
      setSuccessMsg(`Sale of $${total.toFixed(2)} completed!`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      console.error('Checkout failed', e)
    } finally {
      setCheckingOut(false)
    }
  }

  const openLog = async () => {
    setShowLog(true)
    api.getTransactions().then(t => setTransactions(t)).catch(() => {})
  }

  const paymentButtons = [
    { label: 'Cash', icon: Wallet },
    { label: 'Card', icon: CreditCard },
    { label: 'Mobile', icon: Smartphone },
  ]

  if (loadingProducts) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>POS Terminal</h1>
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px' }}>
            <CheckCircle style={{ width: '14px', height: '14px' }} />
            {successMsg}
          </div>
        )}
      </div>

      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', color: '#059669', fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '16px',
            whiteSpace: 'nowrap', flexShrink: 0, border: category === cat ? 'none' : '1px solid #e2e8f0',
            color: category === cat ? '#fff' : '#475569', background: category === cat ? '#0f172a' : '#fff', cursor: 'pointer',
          }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? '3fr 1fr' : '1fr', gap: bp.xl ? '16px' : '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '12px' }}>
          {filteredProducts.map(product => (
            <div key={product.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ height: '96px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#cbd5e1' }}>{product.name[0]}</span>
                <span style={{
                  position: 'absolute', top: '6px', right: '6px', padding: '2px 6px',
                  fontSize: '10px', fontWeight: 500, borderRadius: '4px',
                  background: product.status === 'in-stock' ? '#ecfdf5' : product.status === 'low-stock' ? '#fffbeb' : '#fef2f2',
                  color: product.status === 'in-stock' ? '#047857' : product.status === 'low-stock' ? '#b45309' : '#b91c1c',
                }}>
                  {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low' : 'Out'}
                </span>
              </div>
              <div style={{ padding: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{product.name}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px', margin: '2px 0 0 0' }}>${product.price.toFixed(2)}</p>
              </div>
              <button onClick={() => addToCart(product.id)} disabled={product.status === 'out-of-stock'} style={{
                width: '100%', padding: '8px 0', fontSize: '12px', fontWeight: 600,
                color: '#fff', background: '#0f172a', border: 'none', cursor: product.status === 'out-of-stock' ? 'not-allowed' : 'pointer',
                opacity: product.status === 'out-of-stock' ? 0.5 : 1,
              }}>
                Add
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              No products in this category
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Cart ({cart.length})</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', maxHeight: bp.lg ? '240px' : '200px' }}>
            {cart.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '24px 0', margin: 0 }}>Empty</p>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>{item.name[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>${item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                      <Minus style={{ width: '12px', height: '12px' }} />
                    </button>
                    <span style={{ fontSize: '10px', fontWeight: 600, width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                      <Plus style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: 0, minWidth: '48px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <span style={{ color: '#0f172a' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Tax (5%)</span>
              <span style={{ color: '#0f172a' }}>${tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {paymentButtons.map(pb => {
              const Icon = pb.icon
              const isActive = paymentMethod === pb.label
              return (
                <button key={pb.label} onClick={() => setPaymentMethod(pb.label)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 0',
                  fontSize: '10px', fontWeight: 500,
                  background: isActive ? '#0f172a' : '#f8fafc',
                  color: isActive ? '#fff' : '#475569',
                  border: isActive ? 'none' : '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer',
                }}>
                  <Icon style={{ width: '12px', height: '12px' }} /> {pb.label}
                </button>
              )
            })}
            <button onClick={openLog} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 0',
              fontSize: '10px', fontWeight: 500, background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '4px', cursor: 'pointer', color: '#475569',
            }}>
              <History style={{ width: '12px', height: '12px' }} /> Log
            </button>
          </div>

          <div style={{ padding: '0 12px 12px' }}>
            <button onClick={handleCheckout} disabled={cart.length === 0 || checkingOut} style={{
              width: '100%', padding: '8px 0', fontSize: '12px', fontWeight: 600,
              color: '#fff', background: cart.length === 0 ? '#94a3b8' : '#0f172a',
              borderRadius: '4px', border: 'none', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: checkingOut ? 0.6 : 1,
            }}>
              {checkingOut ? 'Processing...' : `Checkout $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {showLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setShowLog(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Transactions</h3>
            {transactions.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No transactions yet</p>}
            {transactions.slice(0, 20).map((tx: any) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}>
                <div>
                  <p style={{ fontWeight: 500, color: '#0f172a', margin: 0 }}>{tx.type} — ${tx.amount?.toFixed(2)}</p>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>{tx.customer_name || 'POS Sale'} • {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}</p>
                </div>
                <span style={{ fontWeight: 600, color: tx.status === 'completed' ? '#059669' : '#d97706', textTransform: 'uppercase' }}>{tx.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
