import { beforeEach, describe, expect, it } from 'vitest'
import {
  createOrgBenefit,
  createOrgEmployee,
  createOrgReview,
  deleteOrgBenefit,
  getOrgBenefits,
  getOrgEmployees,
  getOrgPayrollRuns,
  getOrgReviews,
  getOrgTimeEntries,
  loadHrmState,
  logOrgTime,
  retireOrgEmployee,
  runOrgPayroll,
  saveHrmState,
  setOrgPayrollStatus,
  terminateOrgEmployee,
  updateOrgBenefit,
  updateOrgEmployee,
  updateOrgReview,
} from '@/data/orgHRM'

const ORG = 'ORG-001'
const KEY = 'merchant_org_hrm_ORG-001'

describe('orgHRM (mock data layer)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds a fresh HRM state per org', () => {
    const state = loadHrmState(ORG)
    expect(state.employees).toHaveLength(13)
    expect(state.benefits).toHaveLength(5)
    expect(state.payrollRuns).toHaveLength(11)
    expect(state.timeEntries.length).toBeGreaterThan(0)
    expect(state.reviews.length).toBeGreaterThan(0)
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('keeps HRM data scoped per organisation', () => {
    loadHrmState('ORG-001')
    expect(localStorage.getItem('merchant_org_hrm_ORG-001')).not.toBeNull()
    expect(localStorage.getItem('merchant_org_hrm_ORG-999')).toBeNull()
  })

  it('loads persisted state when the version matches', () => {
    const state = loadHrmState(ORG)
    state.employees = []
    saveHrmState(ORG, state)
    expect(loadHrmState(ORG).employees).toEqual([])
  })

  it('reseeds when stored state is corrupt', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(loadHrmState(ORG).employees).toHaveLength(13)
  })

  describe('employees', () => {
    it('seeds the full employee lifecycle statuses', () => {
      const employees = getOrgEmployees(ORG)
      expect(employees.filter(e => e.status === 'active')).toHaveLength(9)
      expect(employees.filter(e => e.status === 'probation')).toHaveLength(1)
      expect(employees.filter(e => e.status === 'on-leave')).toHaveLength(1)
      expect(employees.filter(e => e.status === 'retired')).toHaveLength(1)
      expect(employees.filter(e => e.status === 'terminated')).toHaveLength(1)
    })

    it('creates an employee defaulting to probation', () => {
      const created = createOrgEmployee(ORG, {
        name: '  New Hire  ', email: 'hire@sunrise.example', phone: '', department: '  Sales  ',
        jobTitle: 'Associate', employmentType: 'full-time', hireDate: '2026-08-01', salary: 1800,
      })
      expect(created.id).toBe('EMP-014')
      expect(created.name).toBe('New Hire')
      expect(created.department).toBe('Sales')
      expect(created.status).toBe('probation')
      expect(getOrgEmployees(ORG)).toHaveLength(14)
    })

    it('updates an employee and throws for unknown ids', () => {
      const updated = updateOrgEmployee(ORG, 'EMP-001', { salary: 9000, status: 'active' })
      expect(updated.salary).toBe(9000)
      expect(getOrgEmployees(ORG).find(e => e.id === 'EMP-001')?.salary).toBe(9000)
      expect(() => updateOrgEmployee(ORG, 'EMP-999', { salary: 1 })).toThrow('Employee not found')
    })

    it('retires and terminates employees (lifecycle end)', () => {
      expect(retireOrgEmployee(ORG, 'EMP-002').status).toBe('retired')
      expect(terminateOrgEmployee(ORG, 'EMP-003').status).toBe('terminated')
      expect(getOrgEmployees(ORG).find(e => e.id === 'EMP-002')?.status).toBe('retired')
      expect(getOrgEmployees(ORG).find(e => e.id === 'EMP-003')?.status).toBe('terminated')
      expect(() => retireOrgEmployee(ORG, 'EMP-999')).toThrow('Employee not found')
    })
  })

  describe('benefits', () => {
    it('derives enrollment counts from employees (cost = 3,845/month)', () => {
      const benefits = getOrgBenefits(ORG)
      const byId = Object.fromEntries(benefits.map(b => [b.id, b]))
      expect(byId['BNF-001'].enrollment).toBe(9) // health
      expect(byId['BNF-002'].enrollment).toBe(13) // pension
      expect(byId['BNF-003'].enrollment).toBe(6) // transport
      expect(byId['BNF-004'].enrollment).toBe(11) // life
      expect(byId['BNF-005'].enrollment).toBe(8) // training
      expect(benefits.reduce((sum, b) => sum + b.cost * b.enrollment, 0)).toBe(3845)
    })

    it('creates, updates and deletes benefits', () => {
      const created = createOrgBenefit(ORG, { name: 'Dental Cover', type: 'health', cost: 60, description: '' })
      expect(created.id).toBe('BNF-006')
      expect(created.enrollment).toBe(0)
      expect(getOrgBenefits(ORG)).toHaveLength(6)

      const updated = updateOrgBenefit(ORG, created.id, { cost: 75 })
      expect(updated.cost).toBe(75)
      expect(() => updateOrgBenefit(ORG, 'BNF-999', { cost: 1 })).toThrow('Benefit not found')

      deleteOrgBenefit(ORG, 'BNF-005')
      expect(getOrgBenefits(ORG).find(b => b.id === 'BNF-005')).toBeUndefined()
      expect(getOrgEmployees(ORG).every(e => !e.benefits.includes('BNF-005'))).toBe(true)
    })
  })

  describe('payroll', () => {
    it('seeds runs whose gross sums to the monthly payroll (40,300)', () => {
      const runs = getOrgPayrollRuns(ORG)
      expect(runs.reduce((sum, r) => sum + r.gross, 0)).toBe(40300)
      expect(runs.every(r => r.net === r.gross - r.tax)).toBe(true)
    })

    it('runs payroll for paid-status employees only, without duplicates', () => {
      const created = runOrgPayroll(ORG, 'Sep 2099')
      expect(created).toHaveLength(11) // 9 active + 1 probation + 1 on-leave
      const duplicate = runOrgPayroll(ORG, 'Sep 2099')
      expect(duplicate).toHaveLength(0)
      const runs = getOrgPayrollRuns(ORG).filter(r => r.period === 'Sep 2099')
      expect(runs).toHaveLength(11)
      expect(runs[0].status).toBe('pending')
    })

    it('marks runs paid and throws for unknown runs', () => {
      const run = setOrgPayrollStatus(ORG, 'PAY-008', 'paid')
      expect(run.status).toBe('paid')
      expect(getOrgPayrollRuns(ORG).find(r => r.id === 'PAY-008')?.status).toBe('paid')
      expect(() => setOrgPayrollStatus(ORG, 'PAY-999', 'paid')).toThrow('Payroll run not found')
    })
  })

  describe('time & attendance', () => {
    it('logs time and prepends the entry', () => {
      const entry = logOrgTime(ORG, { employee_id: 'EMP-004', date: '2026-08-01', hours: 8, overtime_hours: 2 })
      expect(entry.id).toBe('TM-009')
      expect(entry.employee_name).toBe('Michael Owusu')
      expect(getOrgTimeEntries(ORG)[0].id).toBe('TM-009')
      expect(() => logOrgTime(ORG, { employee_id: 'EMP-999', date: '2026-08-01', hours: 8 })).toThrow('Employee not found')
    })
  })

  describe('performance reviews', () => {
    it('seeds reviews with derived ratings', () => {
      const reviews = getOrgReviews(ORG)
      expect(reviews).toHaveLength(6)
      expect(reviews.find(r => r.id === 'REV-001')?.rating).toBe('exceeds')
      expect(reviews.find(r => r.id === 'REV-003')?.rating).toBe('meets')
      expect(reviews.find(r => r.id === 'REV-005')?.rating).toBe('below')
    })

    it('creates a review and derives the rating from the score', () => {
      const review = createOrgReview(ORG, { employee_id: 'EMP-003', period: 'H2 2026', score: 4.7, notes: 'Great progress' })
      expect(review.id).toBe('REV-007')
      expect(review.rating).toBe('exceeds')
      expect(review.status).toBe('pending')
      expect(() => createOrgReview(ORG, { employee_id: 'EMP-999', period: 'H2 2026', score: 4 })).toThrow('Employee not found')
    })

    it('recomputes rating on score change and stamps completion', () => {
      const review = updateOrgReview(ORG, 'REV-005', { score: 4.6 })
      expect(review.rating).toBe('exceeds')
      expect(review.reviewed_at).toBe('')

      const completed = updateOrgReview(ORG, 'REV-005', { status: 'completed' })
      expect(completed.status).toBe('completed')
      expect(completed.reviewed_at).not.toBe('')
      expect(() => updateOrgReview(ORG, 'REV-999', { status: 'completed' })).toThrow('Review not found')
    })
  })
})
