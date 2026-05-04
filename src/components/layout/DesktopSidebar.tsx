import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Settings, HelpCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/credit', label: 'Credit Ledger', icon: CreditCard },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
]

export function DesktopSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-shrink-0 w-56 bg-white border-r border-slate-200 flex flex-col z-40">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">MerchantCore</h1>
            <p className="text-[10px] text-slate-500 font-medium">Business Pro</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <button className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4 flex-shrink-0" />
          Quick Sale
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          Support
        </button>
      </div>
    </aside>
  )
}
