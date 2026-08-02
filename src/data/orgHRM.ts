// Mock Human Resources (HRM) data for ORGANISATION workspaces.
//
// Like `finance.ts` and `orgCommerce.ts`, everything lives in localStorage behind the
// promise-based `api.org.hrm.*` calls so a real backend can be swapped in later. Data is
// scoped per organisation (`merchant_org_hrm_{orgId}`) and versioned so it never mixes with
// normal (server-backed) logins or between orgs.
//
// The seed covers the full employee lifecycle (hiring -> probation -> active -> leave ->
// terminated/retired), payroll, time & attendance, performance reviews and benefits.
// Consistent headline numbers used by the HRM overview page:
//   - 13 employees (9 active, 1 probation, 1 on-leave, 1 retired, 1 terminated)
//   - monthly gross payroll = 40,300 (active + probation + on-leave)
//   - monthly benefits cost  = 3,845 (enrollment counts are derived from employees)

export type OrgEmploymentStatus = 'active' | 'probation' | 'on-leave' | 'terminated' | 'retired'
export type OrgEmploymentType = 'full-time' | 'part-time' | 'contract'
export type OrgPayrollStatus = 'pending' | 'paid'
export type OrgReviewRating = 'exceeds' | 'meets' | 'below'
export type OrgReviewStatus = 'pending' | 'completed'
export type OrgBenefitType = 'health' | 'retirement' | 'transport' | 'insurance' | 'training' | 'other'

export interface OrgEmployee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  jobTitle: string
  employmentType: OrgEmploymentType
  hireDate: string
  salary: number
  status: OrgEmploymentStatus
  benefits: string[]
}

export interface OrgEmployeeInput {
  name: string
  email: string
  phone?: string
  department: string
  jobTitle: string
  employmentType: OrgEmploymentType
  hireDate: string
  salary: number
  status?: OrgEmploymentStatus
  benefits?: string[]
}

export interface OrgBenefit {
  id: string
  name: string
  type: OrgBenefitType
  cost: number
  description: string
  enrollment: number
}

export interface OrgBenefitInput {
  name: string
  type: OrgBenefitType
  cost: number
  description?: string
}

export interface OrgPayrollRun {
  id: string
  period: string
  employee_id: string
  employee_name: string
  gross: number
  tax: number
  net: number
  status: OrgPayrollStatus
  processed_at: string
}

export interface OrgTimeEntry {
  id: string
  employee_id: string
  employee_name: string
  date: string
  hours: number
  overtime_hours: number
}

export interface OrgTimeInput {
  employee_id: string
  date: string
  hours: number
  overtime_hours?: number
}

export interface OrgPerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  period: string
  score: number
  rating: OrgReviewRating
  notes: string
  status: OrgReviewStatus
  reviewed_at: string
}

export interface OrgReviewInput {
  employee_id: string
  period: string
  score: number
  notes?: string
}

export interface OrgHrmState {
  employees: OrgEmployee[]
  benefits: OrgBenefit[]
  payrollRuns: OrgPayrollRun[]
  timeEntries: OrgTimeEntry[]
  reviews: OrgPerformanceReview[]
}

const HRM_KEY_PREFIX = 'merchant_org_hrm_'
const HRM_VERSION = 1
const PAYROLL_TAX_RATE = 0.1
const REVIEW_THRESHOLDS = { exceeds: 4.5, meets: 3.5 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function storageKey(orgId: string) {
  return `${HRM_KEY_PREFIX}${orgId}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function currentPeriod(date = new Date()): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function reviewRating(score: number): OrgReviewRating {
  if (score >= REVIEW_THRESHOLDS.exceeds) return 'exceeds'
  if (score >= REVIEW_THRESHOLDS.meets) return 'meets'
  return 'below'
}

function paidStatuses(): OrgEmploymentStatus[] {
  return ['active', 'probation', 'on-leave']
}

function seedHrmState(): OrgHrmState {
  const period = currentPeriod()
  const employees: OrgEmployee[] = [
    { id: 'EMP-001', name: 'Daniel Kofi', email: 'daniel.kofi@sunrise.example', phone: '+233 555 010 1001', department: 'Store Operations', jobTitle: 'Store Director', employmentType: 'full-time', hireDate: '2018-03-12', salary: 8500, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-003', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-002', name: 'Sarah Mensah', email: 'sarah.mensah@sunrise.example', phone: '+233 555 010 1002', department: 'Store Operations', jobTitle: 'Operations Manager', employmentType: 'full-time', hireDate: '2019-06-01', salary: 6200, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-003', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-003', name: 'Grace Addo', email: 'grace.addo@sunrise.example', phone: '+233 555 010 1003', department: 'Store Operations', jobTitle: 'Cashier', employmentType: 'full-time', hireDate: '2021-01-15', salary: 2400, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-004', name: 'Michael Owusu', email: 'michael.owusu@sunrise.example', phone: '+233 555 010 1004', department: 'Sales', jobTitle: 'Sales Associate', employmentType: 'full-time', hireDate: '2022-02-20', salary: 2600, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-005', name: 'Rita Boateng', email: 'rita.boateng@sunrise.example', phone: '+233 555 010 1005', department: 'Logistics', jobTitle: 'Inventory Clerk', employmentType: 'full-time', hireDate: '2022-08-01', salary: 2200, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-004'] },
    { id: 'EMP-006', name: 'Kwame Asante', email: 'kwame.asante@sunrise.example', phone: '+233 555 010 1006', department: 'Finance', jobTitle: 'Accountant', employmentType: 'full-time', hireDate: '2020-09-14', salary: 4800, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-003', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-007', name: 'Efua Mensah', email: 'efua.mensah@sunrise.example', phone: '+233 555 010 1007', department: 'Human Resources', jobTitle: 'HR Manager', employmentType: 'full-time', hireDate: '2021-05-10', salary: 4500, status: 'active', benefits: ['BNF-001', 'BNF-002', 'BNF-003', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-008', name: 'Kojo Appiah', email: 'kojo.appiah@sunrise.example', phone: '+233 555 010 1008', department: 'Logistics', jobTitle: 'Delivery Driver', employmentType: 'contract', hireDate: '2023-03-06', salary: 1800, status: 'active', benefits: ['BNF-002', 'BNF-003', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-009', name: 'Ama Serwaa', email: 'ama.serwaa@sunrise.example', phone: '+233 555 010 1009', department: 'Sales', jobTitle: 'Store Associate', employmentType: 'part-time', hireDate: '2024-11-01', salary: 1600, status: 'active', benefits: ['BNF-002', 'BNF-004'] },
    { id: 'EMP-010', name: 'Yaw Boateng', email: 'yaw.boateng@sunrise.example', phone: '+233 555 010 1010', department: 'IT', jobTitle: 'IT Support', employmentType: 'full-time', hireDate: '2025-01-20', salary: 3500, status: 'probation', benefits: ['BNF-001', 'BNF-002', 'BNF-004', 'BNF-005'] },
    { id: 'EMP-011', name: 'Abena Osei', email: 'abena.osei@sunrise.example', phone: '+233 555 010 1011', department: 'Store Operations', jobTitle: 'Cashier', employmentType: 'full-time', hireDate: '2025-02-17', salary: 2200, status: 'on-leave', benefits: ['BNF-001', 'BNF-002', 'BNF-004'] },
    { id: 'EMP-012', name: 'Nana Kwame', email: 'nana.kwame@sunrise.example', phone: '+233 555 010 1012', department: 'Store Operations', jobTitle: 'Security Guard', employmentType: 'part-time', hireDate: '2015-07-01', salary: 1900, status: 'retired', benefits: ['BNF-002', 'BNF-003'] },
    { id: 'EMP-013', name: 'Kofi Tetteh', email: 'kofi.tetteh@sunrise.example', phone: '+233 555 010 1013', department: 'Logistics', jobTitle: 'Warehouse Assistant', employmentType: 'full-time', hireDate: '2019-09-02', salary: 2000, status: 'terminated', benefits: ['BNF-002'] },
  ]

  const benefits: OrgBenefit[] = [
    { id: 'BNF-001', name: 'Health Insurance', type: 'health', cost: 150, description: 'Private medical cover for employee and dependants', enrollment: 0 },
    { id: 'BNF-002', name: 'Pension (SSNIT)', type: 'retirement', cost: 80, description: 'Contributory retirement savings plan', enrollment: 0 },
    { id: 'BNF-003', name: 'Transport Allowance', type: 'transport', cost: 120, description: 'Monthly transport subsidy', enrollment: 0 },
    { id: 'BNF-004', name: 'Life Insurance', type: 'insurance', cost: 45, description: 'Group life cover', enrollment: 0 },
    { id: 'BNF-005', name: 'Staff Training Fund', type: 'training', cost: 30, description: 'Skill development and certification budget', enrollment: 0 },
  ]

  const payrollRuns: OrgPayrollRun[] = [
    { id: 'PAY-001', period, employee_id: 'EMP-001', employee_name: 'Daniel Kofi', gross: 8500, tax: 850, net: 7650, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-002', period, employee_id: 'EMP-002', employee_name: 'Sarah Mensah', gross: 6200, tax: 620, net: 5580, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-003', period, employee_id: 'EMP-003', employee_name: 'Grace Addo', gross: 2400, tax: 240, net: 2160, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-004', period, employee_id: 'EMP-004', employee_name: 'Michael Owusu', gross: 2600, tax: 260, net: 2340, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-005', period, employee_id: 'EMP-005', employee_name: 'Rita Boateng', gross: 2200, tax: 220, net: 1980, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-006', period, employee_id: 'EMP-006', employee_name: 'Kwame Asante', gross: 4800, tax: 480, net: 4320, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-007', period, employee_id: 'EMP-007', employee_name: 'Efua Mensah', gross: 4500, tax: 450, net: 4050, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-008', period, employee_id: 'EMP-008', employee_name: 'Kojo Appiah', gross: 1800, tax: 180, net: 1620, status: 'pending', processed_at: daysAgo(1) },
    { id: 'PAY-009', period, employee_id: 'EMP-009', employee_name: 'Ama Serwaa', gross: 1600, tax: 160, net: 1440, status: 'paid', processed_at: daysAgo(3) },
    { id: 'PAY-010', period, employee_id: 'EMP-010', employee_name: 'Yaw Boateng', gross: 3500, tax: 350, net: 3150, status: 'pending', processed_at: daysAgo(1) },
    { id: 'PAY-011', period, employee_id: 'EMP-011', employee_name: 'Abena Osei', gross: 2200, tax: 220, net: 1980, status: 'paid', processed_at: daysAgo(3) },
  ]

  const timeEntries: OrgTimeEntry[] = [
    { id: 'TM-001', employee_id: 'EMP-001', employee_name: 'Daniel Kofi', date: daysAgo(1), hours: 8, overtime_hours: 0 },
    { id: 'TM-002', employee_id: 'EMP-002', employee_name: 'Sarah Mensah', date: daysAgo(1), hours: 8, overtime_hours: 0 },
    { id: 'TM-003', employee_id: 'EMP-003', employee_name: 'Grace Addo', date: daysAgo(1), hours: 8, overtime_hours: 0 },
    { id: 'TM-004', employee_id: 'EMP-004', employee_name: 'Michael Owusu', date: daysAgo(1), hours: 8, overtime_hours: 2 },
    { id: 'TM-005', employee_id: 'EMP-005', employee_name: 'Rita Boateng', date: daysAgo(1), hours: 8, overtime_hours: 0 },
    { id: 'TM-006', employee_id: 'EMP-002', employee_name: 'Sarah Mensah', date: daysAgo(2), hours: 8, overtime_hours: 0 },
    { id: 'TM-007', employee_id: 'EMP-003', employee_name: 'Grace Addo', date: daysAgo(2), hours: 4, overtime_hours: 0 },
    { id: 'TM-008', employee_id: 'EMP-006', employee_name: 'Kwame Asante', date: daysAgo(2), hours: 8, overtime_hours: 1 },
  ]

  const reviews: OrgPerformanceReview[] = [
    { id: 'REV-001', employee_id: 'EMP-001', employee_name: 'Daniel Kofi', period: 'H1 2026', score: 4.6, rating: reviewRating(4.6), notes: 'Strong leadership and growth across all departments.', status: 'completed', reviewed_at: daysAgo(9) },
    { id: 'REV-002', employee_id: 'EMP-002', employee_name: 'Sarah Mensah', period: 'H1 2026', score: 4.2, rating: reviewRating(4.2), notes: 'Consistent operational excellence.', status: 'completed', reviewed_at: daysAgo(9) },
    { id: 'REV-003', employee_id: 'EMP-003', employee_name: 'Grace Addo', period: 'H1 2026', score: 3.8, rating: reviewRating(3.8), notes: 'Reliable at the till, great with customers.', status: 'completed', reviewed_at: daysAgo(8) },
    { id: 'REV-004', employee_id: 'EMP-006', employee_name: 'Kwame Asante', period: 'H1 2026', score: 4.7, rating: reviewRating(4.7), notes: 'Outstanding financial control.', status: 'completed', reviewed_at: daysAgo(8) },
    { id: 'REV-005', employee_id: 'EMP-010', employee_name: 'Yaw Boateng', period: 'H1 2026', score: 3.4, rating: reviewRating(3.4), notes: 'Solid start on probation; needs to improve documentation.', status: 'pending', reviewed_at: '' },
    { id: 'REV-006', employee_id: 'EMP-004', employee_name: 'Michael Owusu', period: 'H1 2026', score: 4.0, rating: reviewRating(4.0), notes: 'Good sales numbers.', status: 'pending', reviewed_at: '' },
  ]

  return { employees, benefits, payrollRuns, timeEntries, reviews }
}

export function loadHrmState(orgId: string): OrgHrmState {
  const key = storageKey(orgId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as { version: number; state: OrgHrmState }
      if (parsed && parsed.version === HRM_VERSION && parsed.state) return parsed.state
    }
  } catch {
    // corrupt or outdated storage -> reseed fresh
  }
  const fresh = seedHrmState()
  saveHrmState(orgId, fresh)
  return fresh
}

export function saveHrmState(orgId: string, state: OrgHrmState) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({ version: HRM_VERSION, state }))
  } catch {
    return
  }
}

function nextId(ids: string[], prefix: string): string {
  const nums = ids
    .filter(id => id.startsWith(`${prefix}-`))
    .map(id => parseInt(id.replace(`${prefix}-`, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

// ---- Employees -------------------------------------------------------------

export function getOrgEmployees(orgId: string): OrgEmployee[] {
  return loadHrmState(orgId).employees
}

export function createOrgEmployee(orgId: string, input: OrgEmployeeInput): OrgEmployee {
  const state = loadHrmState(orgId)
  const employee: OrgEmployee = {
    id: nextId(state.employees.map(e => e.id), 'EMP'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() ?? '',
    department: input.department.trim(),
    jobTitle: input.jobTitle.trim(),
    employmentType: input.employmentType,
    hireDate: input.hireDate,
    salary: input.salary || 0,
    status: input.status ?? 'probation',
    benefits: input.benefits ?? [],
  }
  state.employees.push(employee)
  saveHrmState(orgId, state)
  return employee
}

export function updateOrgEmployee(orgId: string, employeeId: string, patch: Partial<OrgEmployeeInput>): OrgEmployee {
  const state = loadHrmState(orgId)
  const employee = state.employees.find(e => e.id === employeeId)
  if (!employee) throw new Error('Employee not found')
  const merged = { ...employee, ...patch }
  if (patch.name !== undefined) merged.name = patch.name.trim()
  if (patch.email !== undefined) merged.email = patch.email.trim()
  if (patch.department !== undefined) merged.department = patch.department.trim()
  if (patch.jobTitle !== undefined) merged.jobTitle = patch.jobTitle.trim()
  if (patch.salary !== undefined) merged.salary = patch.salary || 0
  Object.assign(employee, merged)
  saveHrmState(orgId, state)
  return employee
}

export function retireOrgEmployee(orgId: string, employeeId: string): OrgEmployee {
  return updateOrgEmployee(orgId, employeeId, { status: 'retired' })
}

export function terminateOrgEmployee(orgId: string, employeeId: string): OrgEmployee {
  return updateOrgEmployee(orgId, employeeId, { status: 'terminated' })
}

// ---- Benefits --------------------------------------------------------------

export function getOrgBenefits(orgId: string): OrgBenefit[] {
  const state = loadHrmState(orgId)
  return state.benefits.map(b => ({
    ...b,
    enrollment: state.employees.filter(e => e.benefits.includes(b.id)).length,
  }))
}

export function createOrgBenefit(orgId: string, input: OrgBenefitInput): OrgBenefit {
  const state = loadHrmState(orgId)
  const benefit: OrgBenefit = {
    id: nextId(state.benefits.map(b => b.id), 'BNF'),
    name: input.name.trim(),
    type: input.type,
    cost: input.cost || 0,
    description: input.description?.trim() ?? '',
    enrollment: 0,
  }
  state.benefits.push(benefit)
  saveHrmState(orgId, state)
  return benefit
}

export function updateOrgBenefit(orgId: string, benefitId: string, patch: Partial<OrgBenefitInput>): OrgBenefit {
  const state = loadHrmState(orgId)
  const benefit = state.benefits.find(b => b.id === benefitId)
  if (!benefit) throw new Error('Benefit not found')
  const merged = { ...benefit, ...patch }
  if (patch.name !== undefined) merged.name = patch.name.trim()
  if (patch.cost !== undefined) merged.cost = patch.cost || 0
  Object.assign(benefit, merged)
  saveHrmState(orgId, state)
  return getOrgBenefits(orgId).find(b => b.id === benefitId) as OrgBenefit
}

export function deleteOrgBenefit(orgId: string, benefitId: string) {
  const state = loadHrmState(orgId)
  state.benefits = state.benefits.filter(b => b.id !== benefitId)
  state.employees.forEach(e => {
    e.benefits = e.benefits.filter(id => id !== benefitId)
  })
  saveHrmState(orgId, state)
}

// ---- Payroll ---------------------------------------------------------------

export function getOrgPayrollRuns(orgId: string): OrgPayrollRun[] {
  return loadHrmState(orgId).payrollRuns
}

export function runOrgPayroll(orgId: string, period: string): OrgPayrollRun[] {
  const state = loadHrmState(orgId)
  const existing = new Set(state.payrollRuns.filter(r => r.period === period).map(r => r.employee_id))
  const created: OrgPayrollRun[] = []
  for (const employee of state.employees) {
    if (!paidStatuses().includes(employee.status) || existing.has(employee.id)) continue
    const tax = Math.round(employee.salary * PAYROLL_TAX_RATE)
    const run: OrgPayrollRun = {
      id: nextId(state.payrollRuns.map(r => r.id), 'PAY'),
      period,
      employee_id: employee.id,
      employee_name: employee.name,
      gross: employee.salary,
      tax,
      net: employee.salary - tax,
      status: 'pending',
      processed_at: new Date().toISOString().slice(0, 10),
    }
    state.payrollRuns.unshift(run)
    created.push(run)
  }
  if (created.length) saveHrmState(orgId, state)
  return created
}

export function setOrgPayrollStatus(orgId: string, runId: string, status: OrgPayrollStatus): OrgPayrollRun {
  const state = loadHrmState(orgId)
  const run = state.payrollRuns.find(r => r.id === runId)
  if (!run) throw new Error('Payroll run not found')
  run.status = status
  saveHrmState(orgId, state)
  return run
}

// ---- Time & Attendance -----------------------------------------------------

export function getOrgTimeEntries(orgId: string): OrgTimeEntry[] {
  return loadHrmState(orgId).timeEntries
}

export function logOrgTime(orgId: string, input: OrgTimeInput): OrgTimeEntry {
  const state = loadHrmState(orgId)
  const employee = state.employees.find(e => e.id === input.employee_id)
  if (!employee) throw new Error('Employee not found')
  const entry: OrgTimeEntry = {
    id: nextId(state.timeEntries.map(t => t.id), 'TM'),
    employee_id: employee.id,
    employee_name: employee.name,
    date: input.date,
    hours: input.hours || 0,
    overtime_hours: input.overtime_hours ?? 0,
  }
  state.timeEntries.unshift(entry)
  saveHrmState(orgId, state)
  return entry
}

// ---- Performance Reviews ---------------------------------------------------

export function getOrgReviews(orgId: string): OrgPerformanceReview[] {
  return loadHrmState(orgId).reviews
}

export function createOrgReview(orgId: string, input: OrgReviewInput): OrgPerformanceReview {
  const state = loadHrmState(orgId)
  const employee = state.employees.find(e => e.id === input.employee_id)
  if (!employee) throw new Error('Employee not found')
  const review: OrgPerformanceReview = {
    id: nextId(state.reviews.map(r => r.id), 'REV'),
    employee_id: employee.id,
    employee_name: employee.name,
    period: input.period.trim(),
    score: input.score,
    rating: reviewRating(input.score),
    notes: input.notes?.trim() ?? '',
    status: 'pending',
    reviewed_at: '',
  }
  state.reviews.unshift(review)
  saveHrmState(orgId, state)
  return review
}

export function updateOrgReview(orgId: string, reviewId: string, patch: Partial<Omit<OrgReviewInput, 'employee_id'>> & { status?: OrgReviewStatus }): OrgPerformanceReview {
  const state = loadHrmState(orgId)
  const review = state.reviews.find(r => r.id === reviewId)
  if (!review) throw new Error('Review not found')
  const merged = { ...review, ...patch }
  if (patch.score !== undefined) merged.rating = reviewRating(patch.score)
  if (patch.status === 'completed') merged.reviewed_at = new Date().toISOString().slice(0, 10)
  Object.assign(review, merged)
  saveHrmState(orgId, state)
  return review
}
