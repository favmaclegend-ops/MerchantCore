import { Bell, User, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageConfig: Record<string, { title: string; search?: string }> = {
  '/': { title: 'Dashboard' },
  '/inventory': { title: 'Inventory Manager', search: 'Search inventory...' },
  '/pos': { title: 'POS Terminal', search: 'Search products...' },
  '/credit': { title: 'Credit Ledger', search: 'Search accounts...' },
  '/customers': { title: 'Customer Directory', search: 'Search customers...' },
}

export function DesktopHeader() {
  const location = useLocation()
  const config = pageConfig[location.pathname] ?? pageConfig['/']

  return (
    <header className="hidden lg:flex flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 items-center justify-between z-30">
      <h2 className="text-sm font-semibold text-slate-900 truncate">{config.title}</h2>
      <div className="flex items-center gap-2">
        {config.search && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={config.search}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs w-48 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        )}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-900 leading-tight">John Doe</p>
            <p className="text-[10px] text-slate-500 leading-tight">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
