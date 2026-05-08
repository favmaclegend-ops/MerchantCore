import { useState } from 'react'
import { Search, Filter, Mail, Edit, MoreVertical, CreditCard } from 'lucide-react'
import { customers, recentContacts, purchaseHistory } from '@/data/mockData'
import { cn } from '@/lib/utils'

export function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0])

  return (
    <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Customer Directory</h1>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs w-48 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50">
              <Mail className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50">
              <CreditCard className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 lg:gap-4">
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">Recent Contacts</h3>
              <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700">
                <Filter className="w-3 h-3" /> Filter
              </button>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {recentContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedCustomer(customers.find(c => c.avatar === contact.avatar)!)}
                  className={cn('w-full p-3 flex items-center gap-2.5 text-left hover:bg-slate-50',
                    selectedCustomer?.avatar === contact.avatar && 'bg-slate-50'
                  )}
                >
                  <div className="w-9 h-9 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-700">{contact.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{contact.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{contact.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-900">${contact.amount.toLocaleString()}</p>
                    <span className={cn('text-[10px] font-medium uppercase',
                      contact.status === 'paid' && 'text-emerald-600',
                      contact.status === 'overdue' && 'text-red-600',
                      contact.status === 'pending' && 'text-amber-600',
                      contact.status === 'active' && 'text-emerald-600'
                    )}>{contact.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold">{selectedCustomer?.avatar}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold truncate">{selectedCustomer?.name}</h2>
                      <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap',
                        selectedCustomer?.tier === 'platinum' && 'bg-emerald-500/20 text-emerald-300',
                        selectedCustomer?.tier === 'gold' && 'bg-amber-500/20 text-amber-300',
                        selectedCustomer?.tier === 'silver' && 'bg-slate-500/20 text-slate-300',
                        selectedCustomer?.tier === 'bronze' && 'bg-orange-500/20 text-orange-300'
                      )}>{selectedCustomer?.tier.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{selectedCustomer?.company}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px]">{selectedCustomer?.email}</span>
                      <span className="whitespace-nowrap">{selectedCustomer?.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-4">
                <span className="text-[10px] text-slate-500 uppercase">Total Spent</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">${selectedCustomer?.totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-4">
                <span className="text-[10px] text-slate-500 uppercase">Credit Limit</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">${selectedCustomer?.creditLimit.toLocaleString()}</p>
              </div>
              <div className="p-4">
                <span className="text-[10px] text-slate-500 uppercase">Last Purchase</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{selectedCustomer?.lastPurchase}</p>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4 mb-3 border-b border-slate-100 pb-2">
                <button className="text-xs font-medium text-slate-900 border-b-2 border-slate-900 pb-2 -mb-2.5">History</button>
                <button className="text-xs font-medium text-slate-500 hover:text-slate-700">Ledger</button>
                <button className="text-xs font-medium text-slate-500 hover:text-slate-700">Analytics</button>
              </div>

              <div className="space-y-2">
                {purchaseHistory.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-xs">📄</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-slate-900 truncate">{order.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{order.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-semibold text-slate-900">${order.amount.toLocaleString()}</p>
                      <span className={cn('text-[10px] font-medium uppercase',
                        order.status === 'settled' && 'text-emerald-600',
                        order.status === 'cancelled' && 'text-slate-400'
                      )}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-3 py-2 text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
                VIEW ALL TRANSACTIONS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
