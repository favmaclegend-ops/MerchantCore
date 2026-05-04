import { Routes, Route } from 'react-router-dom'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { DesktopHeader } from '@/components/layout/DesktopHeader'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { POSPage } from '@/pages/pos/POSPage'
import { CreditLedgerPage } from '@/pages/credit/CreditLedgerPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'

export default function App() {
  return (
    <div className="app-1 flex h-screen overflow-hidden bg-slate-50">
      <DesktopSidebar />
      <div className="wrapper-1 flex-1 flex flex-col min-w-0 overflow-hidden">
        <DesktopHeader />
        <MobileHeader />
        <div className="sub_wrapper2-1 flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/credit" element={<CreditLedgerPage />} />
            <Route path="/customers" element={<CustomersPage />} />
          </Routes>
        </div>
        <MobileNavbar />
      </div>
    </div>
  )
}
