import { describe, it, expect } from 'vitest'
import { evaluateFormula, getColumnName, getCellId } from '@/pages/spreadsheet/spreadContext'

describe('spreadsheet helpers', () => {
  it('maps column names', () => {
    expect(getColumnName(0)).toBe('A')
    expect(getColumnName(25)).toBe('Z')
    expect(getColumnName(26)).toBe('AA')
    expect(getColumnName(51)).toBe('AZ')
  })

  it('builds cell ids', () => {
    expect(getCellId(0, 0)).toBe('A1')
    expect(getCellId(25, 99)).toBe('Z100')
    expect(getCellId(26, 4)).toBe('AA5')
  })

  it('evaluates arithmetic formulas', () => {
    expect(evaluateFormula('=1+2*3')).toBe('7')
    expect(evaluateFormula('=(1+2)*3')).toBe('9')
    expect(evaluateFormula('=10/4')).toBe('2.5')
    expect(evaluateFormula('=-5+2')).toBe('-3')
    expect(evaluateFormula('=0.1+0.2')).toBe('0.3')
  })

  it('rejects non-formulas', () => {
    expect(evaluateFormula('hello')).toBeNull()
    expect(evaluateFormula('')).toBeNull()
  })

  it('evaluates empty formulas', () => {
    expect(evaluateFormula('=')).toBe('')
  })

  it('resolves cell references from the DOM', () => {
    const a1 = document.createElement('input')
    a1.id = 'A1'
    a1.value = '10'
    const b1 = document.createElement('input')
    b1.id = 'B1'
    b1.value = '5'
    document.body.append(a1, b1)
    try {
      expect(evaluateFormula('=A1+B1*2')).toBe('20')
      expect(evaluateFormula('=B1-A1')).toBe('-5')
    } finally {
      a1.remove()
      b1.remove()
    }
  })

  it('protects against circular references', () => {
    const a1 = document.createElement('input')
    a1.id = 'A1'
    a1.value = '=B1'
    const b1 = document.createElement('input')
    b1.id = 'B1'
    b1.value = '=A1'
    document.body.append(a1, b1)
    try {
      expect(evaluateFormula('=A1')).toBeNull()
    } finally {
      a1.remove()
      b1.remove()
    }
  })
})
