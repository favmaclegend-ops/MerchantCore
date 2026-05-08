import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/credit', label: 'Credit', icon: CreditCard },
  { path: '/home/customers', label: 'More', icon: Users },
]

export function MobileNavbar() {
  const location = useLocation();

  return (
    <nav className="m-nav-1 lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 px-1 z-40">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors min-w-[56px]',
              isActive ? 'text-slate-900' : 'text-slate-400'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive && 'text-slate-900')} />
            <span>{item.label}</span>
          </Link>
        )
      })}
      <div className="flex flex-col items-center gap-1 py-1 px-3 min-w-[56px]">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center -mt-4 shadow-lg">
          <Plus className="w-5 h-5 text-white" />
        </div>
      </div>
    </nav>
  )
}
