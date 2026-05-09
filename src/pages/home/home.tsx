import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Authcontext } from '@/context/auth_context'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { DesktopHeader } from '@/components/layout/DesktopHeader'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { POSPage } from '@/pages/pos/POSPage'
import { CreditLedgerPage } from '@/pages/credit/CreditLedgerPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage';


export default function Home() {
    const { user, loading } = useContext(Authcontext)

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/" replace />
    }

    return (
        <>
            <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
                <DesktopSidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', width: '100%' }}>
                    <DesktopHeader />
                    <MobileHeader />

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '4rem' }}>
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/inventory" element={<InventoryPage />} />
                            <Route path="/pos" element={<POSPage />} />
                            <Route path="/credit" element={<CreditLedgerPage />} />
                            <Route path="/customers" element={<CustomersPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </div>

                    <MobileNavbar />
                </div>
            </div>
        </>
    )
}