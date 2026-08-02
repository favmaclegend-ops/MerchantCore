import { Suspense, useContext, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Authcontext } from '@/context/auth_context'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { DesktopHeader } from '@/components/layout/DesktopHeader'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { MobileHeader } from '@/components/layout/MobileHeader'

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })))
const POSPage = lazy(() => import('@/pages/pos/POSPage').then(m => ({ default: m.POSPage })))
const CreditLedgerPage = lazy(() => import('@/pages/credit/CreditLedgerPage').then(m => ({ default: m.CreditLedgerPage })))
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CalculatorPage = lazy(() => import('@/pages/calculator/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const Users = lazy(() => import('@/pages/users/UsersPage').then(m => ({ default: m.Users })))


export default function Home() {
    const { user, loading } = useContext(Authcontext)

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/" replace />
    }

    return (
        <>
            <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)' }}>
                <DesktopSidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', width: '100%' }}>
                    <DesktopHeader />
                    <MobileHeader />

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '4rem' }}>
                        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>}>
                            <Routes>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/inventory" element={<InventoryPage />} />
                                <Route path="/pos" element={<POSPage />} />
                                <Route path="/credit" element={<CreditLedgerPage />} />
                                <Route path="/customers" element={<CustomersPage />} />
                                <Route path="/calculator" element={<CalculatorPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/users" element={<Users />} />
                            </Routes>
                        </Suspense>
                    </div>

                    <MobileNavbar />
                </div>
            </div>
        </>
    )
}