import { describe, it, expect } from 'vitest'
import {
  inferSeries,
  shiftFormula,
  fillRange,
  getCellId,
  parseCellId,
  evaluateExcelFormula,
  type Grid,
} from '@/pages/spreadsheet/spreadSheetLogic'

function createGrid(data: Record<string, string | number>): Grid {
  const values = new Map<string, string>()
  Object.entries(data).forEach(([id, v]) => values.set(id, String(v)))
  return {
    getValue: (row, col) => values.get(getCellId(col, row)) ?? '',
    setValue: (row, col, value) => values.set(getCellId(col, row), value),
  }
}

describe('spreadSheetLogic', () => {
  it('parses cell ids', () => {
    expect(parseCellId('A1')).toEqual({ col: 0, row: 0 })
    expect(parseCellId('AZ100')).toEqual({ col: 51, row: 99 })
    expect(parseCellId('nope')).toBeNull()
  })

  describe('shiftFormula', () => {
    it('shifts relative references', () => {
      expect(shiftFormula('=A1+B2', 2, 1)).toBe('=B3+C4')
    })

    it('keeps absolute references fixed', () => {
      expect(shiftFormula('=$A$1+A1', 1, 0)).toBe('=$A$1+A2')
    })

    it('shifts both ends of a range', () => {
      expect(shiftFormula('=SUM(A1:B2)', 1, 1)).toBe('=SUM(B2:C3)')
    })
  })

  describe('inferSeries', () => {
    it('repeats constants', () => {
      const s = inferSeries(['5', '5'])!
      expect(s(0, 1, 1)).toBe('5')
    })

    it('continues arithmetic sequences', () => {
      const s = inferSeries(['1', '2'])!
      expect(s(0, 1, 2)).toBe('3')
      expect(s(1, 1, 2)).toBe('4')
    })

    it('continues text+number sequences', () => {
      const s = inferSeries(['Item 1', 'Item 2'])!
      expect(s(0, 1, 2)).toBe('Item 3')
    })

    it('returns null for values with no pattern', () => {
      expect(inferSeries(['1', 'x'])).toBeNull()
      expect(inferSeries([])).toBeNull()
    })
  })

  describe('fillRange', () => {
    it('fills a numeric sequence downward', () => {
      const g = createGrid({ A1: 1, A2: 2 })
      fillRange({ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 4, col: 0 }, g)
      expect(g.getValue(2, 0)).toBe('3')
      expect(g.getValue(3, 0)).toBe('4')
      expect(g.getValue(4, 0)).toBe('5')
    })

    it('fills rightward', () => {
      const g = createGrid({ A1: 10, B1: 20 })
      fillRange({ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 3 }, g)
      expect(g.getValue(0, 2)).toBe('30')
      expect(g.getValue(0, 3)).toBe('40')
    })

    it('shifts formulas when filled downward', () => {
      const g = createGrid({ A1: '=B1*2' })
      fillRange({ row: 0, col: 0 }, { row: 0, col: 0 }, { row: 2, col: 0 }, g)
      expect(g.getValue(1, 0)).toBe('=B2*2')
      expect(g.getValue(2, 0)).toBe('=B3*2')
    })

    it('repeats a constant single value', () => {
      const g = createGrid({ A1: 7 })
      fillRange({ row: 0, col: 0 }, { row: 0, col: 0 }, { row: 3, col: 0 }, g)
      expect(g.getValue(1, 0)).toBe('7')
      expect(g.getValue(3, 0)).toBe('7')
    })

    it('fills a 2D block consistently', () => {
      const g = createGrid({ A1: 1, B1: 2, A2: 3, B2: 4 })
      fillRange({ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 3, col: 2 }, g)
      expect(g.getValue(2, 0)).toBe('5')
      expect(g.getValue(3, 0)).toBe('7')
      expect(g.getValue(0, 2)).toBe('3')
      expect(g.getValue(3, 2)).toBe('9')
    })

    it('fills upward', () => {
      const g = createGrid({ A3: 1, A4: 2 })
      fillRange({ row: 2, col: 0 }, { row: 3, col: 0 }, { row: 0, col: 0 }, g)
      expect(g.getValue(0, 0)).toBe('-1')
      expect(g.getValue(1, 0)).toBe('0')
    })
  })

  describe('evaluateExcelFormula', () => {
    it('evaluates arithmetic and Excel functions', () => {
      const g = createGrid({ A1: 2, B1: 3 })
      expect(evaluateExcelFormula('=A1+B1', g)).toBe('5')
      expect(evaluateExcelFormula('=SUM(A1:B1)', g)).toBe('5')
      expect(evaluateExcelFormula('=1+2*3', g)).toBe('7')
    })

    it('returns null for non formulas and errors', () => {
      expect(evaluateExcelFormula('hello')).toBeNull()
      expect(evaluateExcelFormula('=SUM(')).toBeNull()
    })
  })
})
