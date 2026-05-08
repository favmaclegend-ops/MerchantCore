import { Bell, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Here\'s what\'s happening today' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock tracking & management' },
  '/pos': { title: 'POS Terminal', subtitle: 'Point of sale' },
  '/credit': { title: 'Credit Ledger', subtitle: 'Manage accounts & payments' },
  '/customers': { title: 'Customers', subtitle: 'Directory & profiles' },
}

export function MobileHeader() {
  const location = useLocation()
  const config = pageConfig[location.pathname] ?? pageConfig['/']

  return (
    <header className="m-header-1 lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30">
      
      <div>
        <h2 className="text-lg font-bold text-slate-900">{config.title}</h2>
        {config.subtitle && <p className="text-xs text-slate-500">{config.subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">

        <button className="relative p-2 text-slate-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-slate-600" />
        </div>
      </div>

    </header>
  )
}
