import { Suspense, useContext, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Ban, LogOut } from 'lucide-react'
import { Authcontext } from '@/context/auth_context'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { DesktopHeader } from '@/components/layout/DesktopHeader'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { canManageFinance, canManageHRM, canManageSupply, canManageUsers } from '@/lib/orgAccess'

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })))
const POSPage = lazy(() => import('@/pages/pos/POSPage').then(m => ({ default: m.POSPage })))
const CreditLedgerPage = lazy(() => import('@/pages/credit/CreditLedgerPage').then(m => ({ default: m.CreditLedgerPage })))
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CalculatorPage = lazy(() => import('@/pages/calculator/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const FinancePage = lazy(() => import('@/pages/finance/FinancePage').then(m => ({ default: m.FinancePage })))
const HRMPage = lazy(() => import('@/pages/hrm/HRMPage').then(m => ({ default: m.HRMPage })))
const SupplyChainPage = lazy(() => import('@/pages/supply/SupplyChainPage').then(m => ({ default: m.SupplyChainPage })))
const Users = lazy(() => import('@/pages/users/UsersPage').then(m => ({ default: m.Users })))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
//LAGACY: const SpreadSheet = lazy(() => import('@/pages/spreadsheet/SpreadSheetPage').then(m => ({default: m.SpreadSheetPage})))
const ExternalSheet = lazy(() => import('@/pages/spreadsheet/external/ExternalSheet').then(m => ({default: m.ExternalSheet})))
const MarketPage = lazy(() => import('@/pages/market/MarketPage').then(m => ({default: m.MarketPage})))

export default function Home() {
    const location = useLocation();
    const { user, orgUser, loading, logout } = useContext(Authcontext)
    const bp = useBreakpoint()

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>
    }

    if (!user && !orgUser) {
        return <Navigate to="/" replace />
    }

    if (orgUser?.disabled) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '24px' }}>
                <div style={{ maxWidth: 420, width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ban size={32} color="var(--danger, #ef4444)" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>Account disabled</h2>
                    <p style={{ margin: '12px 0 24px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                        Your account has been disabled by an administrator. You no longer have access to the platform.
                        Contact your administrator for more information.
                    </p>
                    <button
                        onClick={logout}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)' }}>
                <DesktopSidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', width: '100%' }}>
                    <DesktopHeader />
                    <MobileHeader />

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: (location.pathname === '/home/pos' && (bp.lg || bp.md)) ? '0' : '5.5rem' }}>
                        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>}>
                            <Routes>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/inventory" element={<InventoryPage />} />
                                <Route path="/pos" element={<POSPage />} />
                                <Route path="/credit" element={<CreditLedgerPage />} />
                                <Route path="/customers" element={<CustomersPage />} />
                                <Route path="/calculator" element={<CalculatorPage />} />
                                <Route path="/finance" element={canManageFinance(orgUser) ? <FinancePage /> : <Navigate to="/dashboard" replace />} />
                                <Route path="/hrm" element={canManageHRM(orgUser) ? <HRMPage /> : <Navigate to="/dashboard" replace />} />
                                <Route path="/supply" element={canManageSupply(orgUser) ? <SupplyChainPage /> : <Navigate to="/dashboard" replace />} />
                                <Route path="/attendance" element={orgUser ? <AttendancePage /> : <Navigate to="/dashboard" replace />} />
                                <Route path="/notifications" element={orgUser ? <NotificationsPage /> : <Navigate to="/dashboard" replace />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/spreadsheet" element={<ExternalSheet />} />
                                <Route path="/users" element={canManageUsers(orgUser) ? <Users /> : <Navigate to="/dashboard" replace />} />
                                <Route path='/market/*' element={<MarketPage />}/>
                            </Routes>
                        </Suspense>
                    </div>

                    <MobileNavbar />
                </div>
            </div>
        </>
    )
}