import { ArrowUpRight, AlertTriangle, DollarSign, Package, Eye } from 'lucide-react'
import { transactions, alerts } from '@/data/mockData'
import { cn } from '@/lib/utils'
import DLineChart from '@/components/layout/chart'

export function DashboardPage() {
  return (
    <div className="m-dashboard-page-1">
      
      <div className='dashboard-sub-cnt-1 dash-greeting-cnt-1'>
        <h1 className="text-lg font-bold text-slate-900">Good morning, John</h1>
        <p className="text-xs text-slate-500 mt-0.5">Here's what's happening with MerchantCore today.</p>
      </div>

      <div className="dashboard-sub-cnt-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="dash-cards-1 bg-white rounded-lg border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Daily Revenue</span>
            <button className="text-slate-400 hover:text-slate-600 flex-shrink-0"><Eye className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-xl font-bold text-slate-900 truncate">$12,840.50</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] font-medium text-emerald-600">+14.2%</span>
          </div>
          <div className="mt-3 flex items-end gap-0.5 h-10">
            {[40, 55, 90, 50, 35, 55, 70].map((h, i) => (
              <div key={i} className={cn('flex-1 rounded-sm', i === 2 || i === 6 ? 'bg-slate-900' : 'bg-slate-200')} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>


        <div className="dash-cards-1 bg-white rounded-lg border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Credit Outstanding</span>
          </div>
          <p className="text-xl font-bold text-slate-900 truncate">$4,210.00</p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-500">Overdue (3)</span>
              <span className="text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded text-[10px]">Action</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1">
              <div className="bg-red-500 h-1 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <button className="mt-2 w-full py-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
              View Ledger
            </button>
          </div>
        </div>

        <div className="dash-cards-1 bg-white rounded-lg border border-slate-200 p-4 min-w-0">
          <span className="text-[10px] font-medium text-slate-500 uppercase">Total Sales</span>
          <p className="text-xl font-bold text-slate-900 mt-1">142 <span className="text-[10px] font-normal text-slate-500">Units</span></p>
        </div>

        <div className="dash-cards-1 bg-white rounded-lg border border-slate-200 p-4 min-w-0">
          <span className="text-[10px] font-medium text-slate-500 uppercase">Low Stock Alerts</span>
          <p className="text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            8 Items <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          </p>
        </div>
      </div>
        <div className='total_sales_stat-2'>
          <div className='tss-heaad-2'>
            <span>Sales</span>
          </div>
          <DLineChart />
        </div>
      <div className="dash-rcnt-trc-1 dashboard-sub-cnt-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <div className="rcnt-trc-sub-cnt-1 lg:col-span-2 bg-white rounded-lg border border-slate-200 min-w-0">
          
          <div className="rc-cnt1-1 flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="rc-h1-1 text-xs font-semibold text-slate-900">Recent Transactions</h3>
            <button className="text-[10px] text-slate-500 hover:text-slate-700 flex-shrink-0">View All</button>
          </div>

          <div className="recent-cards-sec-1 divide-y divide-slate-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="recent-t-list-1 p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    tx.type === 'sale' && 'bg-emerald-50 text-emerald-600',
                    tx.type === 'payment' && 'bg-blue-50 text-blue-600',
                    tx.type === 'restock' && 'bg-amber-50 text-amber-600'
                  )}>
                    {tx.type === 'sale' && <DollarSign className="w-3.5 h-3.5" />}
                    {tx.type === 'payment' && <DollarSign className="w-3.5 h-3.5" />}
                    {tx.type === 'restock' && <Package className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{tx.customer} #{tx.id}</p>
                    <p className="text-[10px] text-slate-500 truncate">{tx.items} • {tx.date}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-semibold text-slate-900">${tx.amount.toLocaleString()}</p>
                  <p className={cn('text-[10px] font-semibold uppercase',
                    tx.status === 'completed' && 'text-emerald-600',
                    tx.status === 'pending' && 'text-blue-600'
                  )}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="critical-cnt-1 space-y-3 min-w-0">
          <div className="critical-sub-cnt-1 bg-white rounded-lg border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h3 className="fs-a-1 text-xs font-semibold text-slate-900">Critical Alerts</h3>
            </div>

            <div className="p-3 space-y-2 alert-style-cnt-1">
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-style-1 ${cn('p-2.5 rounded-lg border',
                  alert.type === 'low-stock' && 'bg-amber-50 border-amber-200',
                  alert.type === 'overdue' && 'bg-red-50 border-red-200',
                  alert.type === 'system' && 'bg-slate-50 border-slate-200'
                )}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0',
                      alert.type === 'low-stock' && 'text-amber-500',
                      alert.type === 'overdue' && 'text-red-500'
                    )} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-900">{alert.title}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ware-housing-cnt-1 fs-a-1 bg-slate-900 rounded-lg p-4 text-white">
            
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">Warehouse</p>
                <p className="text-xs font-semibold mt-0.5 truncate">Central Warehouse</p>
              </div>
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
            </div>

          </div>

          <div className="ware-housing-info-cnt-1 bg-white rounded-lg border border-slate-200 p-4">
            <span className="text-[10px] font-medium text-slate-500 uppercase">Avg. Ticket</span>
            <p className="text-xl font-bold text-slate-900 mt-1">$90.42 <span className="text-[10px] text-emerald-500 font-medium">↑ 4%</span></p>
          </div>
        </div>

      </div>
    </div>
  )
}
