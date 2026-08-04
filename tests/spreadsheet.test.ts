import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  evaluateExcelFormula,
  getColumnName,
  getCellId,
  copySelection,
  cutSelection,
  pasteSelection,
  Cells,
  SpreadsheetModel,
  spreadsheetModel,
  handleSpreadCellBlur,
  handleSpreadCellFocus,
  handleSpreadSheetValueChange,
} from '@/pages/spreadsheet/spreadSheetLogic'
import { spreadSheetStore } from '@/context/store'
import type { ChangeEvent, FocusEvent } from 'react'

function mountCell(id: string, value = ''): HTMLInputElement {
  const el = document.createElement('input')
  el.id = id
  el.value = value
  document.body.append(el)
  return el
}

function unmountCells(ids: string[]) {
  ids.forEach((id) => document.getElementById(id)?.remove())
}

const allIds = [
  'A1', 'B1', 'C1', 'D1',
  'A2', 'B2', 'C2', 'D2',
  'A3', 'B3', 'C3', 'D3',
  'A4', 'B4', 'C4', 'D4',
  'A5', 'B5', 'C5', 'D5',
  'A6', 'B6', 'C6', 'D6',
]

beforeEach(() => {
  allIds.forEach((id) => mountCell(id))
  spreadsheetModel.reset()
  spreadSheetStore.setState({ currentRow: 0, currentColumn: 0, formularValue: '' })
})

afterEach(() => {
  unmountCells(allIds)
})

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
})

describe('evaluateExcelFormula', () => {
  it('evaluates arithmetic formulas', () => {
    expect(evaluateExcelFormula('=1+2*3')).toBe('7')
    expect(evaluateExcelFormula('=(1+2)*3')).toBe('9')
    expect(evaluateExcelFormula('=10/4')).toBe('2.5')
    expect(evaluateExcelFormula('=-5+2')).toBe('-3')
    expect(evaluateExcelFormula('=0.1+0.2')).toBe('0.3')
  })

  it('rejects non-formulas', () => {
    expect(evaluateExcelFormula('hello')).toBeNull()
    expect(evaluateExcelFormula('')).toBeNull()
  })

  it('evaluates empty formulas', () => {
    expect(evaluateExcelFormula('=')).toBe('')
  })

  it('evaluates SUM ranges from the DOM', () => {
    const a3 = document.getElementById('A3') as HTMLInputElement
    const b3 = document.getElementById('B3') as HTMLInputElement
    a3.value = '5'
    b3.value = '10'
    expect(evaluateExcelFormula('=SUM(A3:B3)')).toBe('15')
  })
})

describe('SpreadsheetModel formula recalc', () => {
  it('evaluates a committed formula to a result', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(2, 0, '5') // A3
    model.setCellValueAt(2, 1, '10') // B3
    model.setCellValueAt(3, 0, '=SUM(A3:B3)') // A4
    expect(model.getValue(3, 0)).toBe('15')
  })

  it('resolves chained formulas (A1 = B1+1)', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(0, 1, '5') // B1
    model.setCellValueAt(0, 0, '=B1+1') // A1
    expect(model.getValue(0, 0)).toBe('6')
  })

  it('recalculates dependents live when a referenced cell changes', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(0, 1, '3') // B1
    model.setCellValueAt(0, 0, '=B1*2') // A1
    expect(model.getValue(0, 0)).toBe('6')
    model.setCellValueAt(0, 1, '4')
    expect(model.getValue(0, 0)).toBe('8')
  })

  it('keeps absolute references fixed and shifts relative in fills', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(0, 0, '=A2+$B$1') // A1
    model.setCellValueAt(1, 0, '10') // A2
    model.setCellValueAt(0, 1, '2') // B1
    expect(model.getValue(0, 0)).toBe('12')
  })

  it('protects against circular references without hanging', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(1, 0, '=A1') // B1
    model.setCellValueAt(0, 0, '=B1') // A1
    expect(typeof model.getValue(0, 0)).toBe('string')
    expect(typeof model.getValue(1, 0)).toBe('string')
  })

  it('clears a cell and updates dependents', () => {
    const model = new SpreadsheetModel()
    model.setCellValueAt(0, 1, '3') // B1
    model.setCellValueAt(0, 0, '=B1+1') // A1
    expect(model.getValue(0, 0)).toBe('4')
    model.clearCellAt(0, 1)
    expect(model.getValue(0, 0)).toBe('1')
  })
})

describe('internal clipboard', () => {
  it('copies and pastes values only', () => {
    spreadsheetModel.setCellValueAt(0, 0, '1')
    spreadsheetModel.setCellValueAt(0, 1, '2')
    spreadsheetModel.setCellValueAt(1, 0, '3')
    spreadsheetModel.setCellValueAt(1, 1, '4')
    Cells.initialSelectionRow = 0
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 1, currentColumn: 1 })
    copySelection(false)

    Cells.initialSelectionRow = 4
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 4, currentColumn: 0 })
    pasteSelection()

    expect(spreadsheetModel.getValue(4, 0)).toBe('1')
    expect(spreadsheetModel.getValue(4, 1)).toBe('2')
    expect(spreadsheetModel.getValue(5, 0)).toBe('3')
    expect(spreadsheetModel.getValue(5, 1)).toBe('4')
  })

  it('copies value + format when requested', () => {
    spreadsheetModel.setCellValueAt(0, 0, 'hello')
    spreadsheetModel.setStyleAt(0, 0, { fontWeight: 'bold', background: 'red' })
    Cells.initialSelectionRow = 0
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 0, currentColumn: 0 })
    copySelection(true)

    Cells.initialSelectionRow = 6
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 6, currentColumn: 0 })
    pasteSelection()

    expect(spreadsheetModel.getValue(6, 0)).toBe('hello')
    expect(spreadsheetModel.dataAt(6, 0).style.fontWeight).toBe('bold')
    expect(spreadsheetModel.dataAt(6, 0).style.background).toBe('red')
  })

  it('value-only copy does not carry format', () => {
    spreadsheetModel.setCellValueAt(0, 0, 'x')
    spreadsheetModel.setStyleAt(0, 0, { fontWeight: 'bold' })
    Cells.initialSelectionRow = 0
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 0, currentColumn: 0 })
    copySelection(false)

    Cells.initialSelectionRow = 6
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 6, currentColumn: 0 })
    pasteSelection()

    expect(spreadsheetModel.getValue(6, 0)).toBe('x')
    expect(spreadsheetModel.dataAt(6, 0).style.fontWeight).toBeUndefined()
  })

  it('cut clears the source cells', () => {
    spreadsheetModel.setCellValueAt(0, 0, '42')
    spreadsheetModel.setCellValueAt(0, 1, '43')
    Cells.initialSelectionRow = 0
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 0, currentColumn: 1 })
    cutSelection(false)

    expect(spreadsheetModel.getValue(0, 0)).toBe('')
    expect(spreadsheetModel.getValue(0, 1)).toBe('')
    expect(spreadsheetModel.dataAt(0, 0).style).toEqual({})
  })

  it('pastes formulas with relative references shifted', () => {
    spreadsheetModel.setCellValueAt(1, 0, '10') // A2
    spreadsheetModel.setCellValueAt(0, 0, '=A2*2') // A1
    Cells.initialSelectionRow = 0
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 0, currentColumn: 0 })
    copySelection(true)

    spreadsheetModel.setCellValueAt(6, 0, '10') // A7 = value the pasted formula reads
    Cells.initialSelectionRow = 5
    Cells.initialSelectionColumn = 0
    spreadSheetStore.setState({ currentRow: 5, currentColumn: 0 })
    pasteSelection()

    expect(spreadsheetModel.getRaw(5, 0)).toBe('=A7*2')
    expect(spreadsheetModel.getValue(5, 0)).toBe('20')
  })
})

describe('cell edit commit flow', () => {
  it('commits a formula and keeps the formula when the following blur fires', () => {
    spreadsheetModel.setCellValueAt(0, 0, '1') // A1
    spreadsheetModel.setCellValueAt(0, 1, '2') // B1
    spreadsheetModel.setCellValueAt(0, 2, '3') // C1
    const d1 = document.getElementById('D1') as HTMLInputElement

    // Simulate: focus D1, type =SUM(A1:C1), press Enter
    handleSpreadCellFocus(
      { currentTarget: d1 } as FocusEvent<HTMLInputElement>,
      0,
      3,
    )
    d1.value = '=SUM(A1:C1)'
    handleSpreadSheetValueChange({
      currentTarget: d1,
    } as ChangeEvent<HTMLInputElement>)
    handleSpreadCellBlur({ currentTarget: d1 } as FocusEvent<HTMLInputElement>)

    expect(spreadsheetModel.getRaw(0, 3)).toBe('=SUM(A1:C1)')
    expect(spreadsheetModel.getValue(0, 3)).toBe('6')
    // syncDom writes the computed value into the input
    expect(d1.value).toBe('6')

    // Now the blur that happens when focus moves away (no user edit)
    handleSpreadCellBlur({ currentTarget: d1 } as FocusEvent<HTMLInputElement>)
    expect(spreadsheetModel.getRaw(0, 3)).toBe('=SUM(A1:C1)')
    expect(spreadsheetModel.getValue(0, 3)).toBe('6')
  })

  it('shows the raw formula again when the cell is focused', () => {
    spreadsheetModel.setCellValueAt(0, 0, '1') // A1
    spreadsheetModel.setCellValueAt(0, 1, '2') // B1
    spreadsheetModel.setCellValueAt(0, 2, '3') // C1
    spreadsheetModel.setCellValueAt(0, 3, '=SUM(A1:C1)') // D1
    const d1 = document.getElementById('D1') as HTMLInputElement

    handleSpreadCellFocus(
      { currentTarget: d1 } as FocusEvent<HTMLInputElement>,
      0,
      3,
    )
    expect(d1.value).toBe('=SUM(A1:C1)')
    expect(spreadSheetStore.getState().formularValue).toBe('=SUM(A1:C1)')
  })

  it('reverts an uncommitted edit on blur', () => {
    spreadsheetModel.setCellValueAt(0, 0, '5') // A1
    const a1 = document.getElementById('A1') as HTMLInputElement
    handleSpreadCellFocus(
      { currentTarget: a1 } as FocusEvent<HTMLInputElement>,
      0,
      0,
    )
    a1.value = 'garbage'
    // never committed to the model -> blur keeps the old value
    handleSpreadCellBlur({ currentTarget: a1 } as FocusEvent<HTMLInputElement>)
    expect(spreadsheetModel.getRaw(0, 0)).toBe('5')
  })
})
