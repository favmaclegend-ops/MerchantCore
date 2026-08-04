declare module "hot-formula-parser" {
  export interface CellPart {
    label: string;
    index: number;
    end?: { index: number };
    start?: { index: number };
  }

  export interface CellCoordinate {
    label: string;
    row: CellPart;
    column: CellPart;
  }

  export interface ParseResult {
    error: string | null;
    result: string | number | null;
  }

  export class Parser {
    on(
      event: "callCellValue",
      callback: (
        cell: CellCoordinate,
        done: (value: string | number) => void,
      ) => void,
    ): this;
    on(
      event: "callRangeValue",
      callback: (
        start: CellCoordinate,
        end: CellCoordinate,
        done: (matrix: (string | number)[][]) => void,
      ) => void,
    ): this;
    parse(expression: string): ParseResult;
  }
}
