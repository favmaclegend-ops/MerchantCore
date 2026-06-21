/*import { Minus, Plus, CreditCard, Smartphone, Wallet, History } from 'lucide-react'


export default function UserCart({total, updateQuantity, cartItems, subtotal, tax}) {

    return (
        <>
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
        </>
    )
}*/