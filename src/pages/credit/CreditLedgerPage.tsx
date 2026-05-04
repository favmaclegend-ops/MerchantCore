import { creditEntries, paymentLogs } from '@/data/mockData'
import { cn } from '@/lib/utils'

export function CreditLedgerPage() {
  return (
    <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-lg p-4 text-white">
          <span className="text-[10px] text-slate-400 uppercase">Total Outstanding</span>
          <p className="text-xl font-bold mt-1">$42,850.20</p>
          <p className="text-[10px] text-emerald-400 mt-1.5">↑ 12% from last month</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[10px] text-slate-500 uppercase">Overdue Accounts</span>
          <p className="text-xl font-bold text-red-600 mt-1">18</p>
          <p className="text-[10px] text-red-500 mt-1.5">Action needed</p>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1">
            <div className="bg-red-500 h-1 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[10px] text-slate-500 uppercase">Collected (MTD)</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">$12,400</p>
          <p className="text-[10px] text-slate-500 mt-1.5">82% target</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-900">Debtor Registry</h3>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">142</span>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-[10px] border border-slate-200 rounded px-2 py-1 bg-white">
              <option>Status: All</option>
              <option>Active</option>
              <option>Overdue</option>
              <option>Critical</option>
            </select>
            <button className="px-3 py-1 text-[10px] font-medium text-white bg-slate-900 rounded hover:bg-slate-800">
              + New Entry
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '480px' }}>
            <thead>
              <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                <th className="text-left font-medium p-3">Customer</th>
                <th className="text-right font-medium p-3">Balance</th>
                <th className="text-left font-medium p-3">Last Payment</th>
                <th className="text-left font-medium p-3">Status</th>
                <th className="text-right font-medium p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {creditEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-600">{entry.customerName.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">{entry.customerName}</p>
                        <p className="text-[10px] text-slate-500">{entry.customerCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right text-xs font-semibold text-slate-900 whitespace-nowrap">${entry.balance.toLocaleString()}</td>
                  <td className="p-3">
                    <p className="text-[10px] text-slate-900 whitespace-nowrap">{entry.lastPayment}</p>
                    {entry.lastPaymentAmount && <p className="text-[10px] text-slate-500">${entry.lastPaymentAmount} PARTIAL</p>}
                  </td>
                  <td className="p-3">
                    <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap',
                      entry.status === 'active' && 'bg-emerald-50 text-emerald-700',
                      entry.status === 'overdue' && 'bg-amber-50 text-amber-700',
                      entry.status === 'critical' && 'bg-red-50 text-red-700'
                    )}>
                      {entry.status === 'active' ? 'Active' : `${entry.overdueDays}d`}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="text-slate-400 hover:text-slate-600 text-sm">•••</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 text-[10px] text-slate-500">
          Showing 1-10 of 142
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900">Payment Logs</h3>
            <button className="text-[10px] text-slate-500 hover:text-slate-700">View All</button>
          </div>
          <div className="p-3 space-y-2">
            {paymentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2.5">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  log.method === 'payment' && 'bg-emerald-100 text-emerald-600',
                  log.method === 'credit' && 'bg-blue-100 text-blue-600',
                  log.method === 'notice' && 'bg-slate-100 text-slate-600'
                )}>
                  {log.method === 'payment' && '✓'}
                  {log.method === 'credit' && '$'}
                  {log.method === 'notice' && '!'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-slate-900 truncate">
                    {log.method === 'payment' && `Payment from ${log.customerName}`}
                    {log.method === 'credit' && `Credit for ${log.customerName}`}
                    {log.method === 'notice' && `Notice to ${log.customerName}`}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{log.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {log.amount > 0 && <p className="text-[10px] font-semibold text-emerald-600">+${log.amount}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase mb-3">Credit Aging</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-600">0-30 Days</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-600">31-60 Days</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-600">60+ Days</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 text-white">
            <span className="text-[10px] text-slate-400 uppercase">Pro Tip</span>
            <p className="text-[10px] text-slate-300 mt-1.5">Early payment discounts can reduce aging credit by 22%.</p>
            <button className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">Configure →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
