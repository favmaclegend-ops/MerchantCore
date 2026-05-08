import { useState } from 'react'
import { Plus, AlertTriangle, BarChart3, Eye } from 'lucide-react'
import { products, inventoryStats, stockTrends } from '@/data/mockData'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/layout/search_cmp'
import DLineChart from '@/components/layout/chart'

export function InventoryPage() {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const filtered = filter === 'all' ? products : filter === 'low' ? products.filter(p => p.status === 'low-stock') : products.filter(p => p.status === 'out-of-stock')

  return (

    <div className="inventory-cnt-3 p-3 lg:p-4 space-y-3 lg:space-y-4">
      <div className="iventory_manager-cnt-3 flex items-center justify-between">

        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">Inventory</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="add-btn-3 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

      </div>


      <div className="stat-cnt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 uppercase">Total Items</span>
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">{inventoryStats.totalItems.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 mt-1">↑ +12 this month</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 uppercase">Low Stock</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{inventoryStats.lowStockAlerts}</p>
          <p className="text-[10px] text-amber-600 mt-1">Reorder soon</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 uppercase">Value</span>
            <Eye className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">${(inventoryStats.inventoryValue / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-emerald-600 mt-1">↑ +4.2%</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 uppercase">Out of Stock</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{inventoryStats.outOfStock}</p>
          <p className="text-[10px] text-red-600 mt-1">Action needed</p>
        </div>
      </div>

      <SearchInput />

      <div className="rounded-lg stock-cnt-3">
        <div className="header-3 flex items-center justify-between p-3 border-b border-slate-100">
          <div className="header-cont-3 flex items-center gap-1">
            {(['all', 'low', 'out'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn('px-2.5 py-1 text-xs font-medium rounded transition-colors',
                  filter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out'}
              </button>
            ))}
          </div>
        </div>

        <div className="stock-table-3">
          {filtered.map((product) => (
            <div className='product-card-3' key={product.id} >
              <div className='p-profile-3'><span>{product.name.substring(0, 1)}</span></div>

              <div className='p-info-3'>

                <div>
                  <h2>{product.name}</h2>
                  <span className='p-cat-3'>{product.category}</span>
                </div>

                <div className='p-price-cnt-3'>
                  <strong className='p-price'>{product.price}</strong>
                  <span>{product.sku}</span>
                </div>

              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-100 text-[10px] text-slate-500">
          Showing {filtered.length} of {products.length} items
        </div>
      </div>

      <div className="stock-trend-cnt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stock-trend-sub-cnt-3 lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Stock Trends</h3>
          
          <div className='chart-cnt-3'>
            <span>Under Development</span>
          </div>

        </div>

        <div className="adv-3 bg-slate-900 rounded-lg p-4 text-white">
          <h3 className="text-xs font-semibold mb-1.5">Automate Orders</h3>
          <p className="text-[10px] text-slate-400 mb-3">Enable smart replenishment to auto-reorder stock.</p>
          <button className="w-full py-2 text-[10px] font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            Configure AI Agent
          </button>
        </div>
      </div>
    </div>
  )
}
