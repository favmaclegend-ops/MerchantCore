import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useStore } from "elk-components";
import { spreadSheetStore } from "@/context/store";
import { Cells, getCellId, handleMultiSelection, deactivateMultiSelection, startSelectionDrag, fillModelRange, spreadsheetModel } from "./spreadSheetLogic";
import { parseCellId } from "./spreadSheetLogic";
import type { CellCoord } from "./spreadSheetLogic";

interface FillHandlePosition {
  top: number;
  left: number;
  visible: boolean;
}

/**
 * Excel-style fill handle: the small square at the bottom-right corner of the
 * current selection. Drag it to expand the selection and auto-fill the cells
 * (numbers, dates, text+numbers and formulas all fill like in Excel).
 */
export function FillHandle() {
  const { currentRow, currentColumn } = useStore(spreadSheetStore);
  const [position, setPosition] = useState<FillHandlePosition>({
    top: 0,
    left: 0,
    visible: false,
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ anchor: CellCoord; source: CellCoord } | null>(null);

  // Keep the handle glued to the bottom-right corner of the selection.
  useEffect(() => {
    const updatePosition = () => {
      const initRow = Cells.initialSelectionRow ?? currentRow;
      const initCol = Cells.initialSelectionColumn ?? currentColumn;
      const farRow = Math.max(initRow, currentRow);
      const farCol = Math.max(initCol, currentColumn);
      const input = document.getElementById(getCellId(farCol, farRow));
      if (!input) {
        setPosition((p) => ({ ...p, visible: false }));
        return;
      }
      const rect = input.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.right, visible: true });
    };

    updatePosition();
    const container = document.getElementById("spreadsheet-scroll-container");
    container?.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      container?.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [currentRow, currentColumn]);

  const handleDragMove = (e: globalThis.MouseEvent) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const input = element?.closest(".spread-cell") as HTMLInputElement | null;
    if (!input) return;
    const coord = parseCellId(input.id);
    if (!coord) return;

    spreadSheetStore.setState({
      currentRow: coord.row,
      currentColumn: coord.col,
    });
    // Live-expand the selection border while dragging.
    handleMultiSelection();
  };

  const handleDragEnd = () => {
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
    setDragging(false);

    const drag = dragRef.current;
    dragRef.current = null;
    if (drag) {
      const state = spreadSheetStore.getState();
      fillModelRange(drag.anchor, drag.source, {
        row: state.currentRow,
        col: state.currentColumn,
      });
      const lastId = getCellId(
        Math.max(state.currentColumn, drag.source.col),
        Math.max(state.currentRow, drag.source.row),
      );
      spreadSheetStore.setState({
        formularValue: spreadsheetModel.getRawFromId(lastId),
      });
    }

    // Clear the expanded selection highlight.
    deactivateMultiSelection();
    handleMultiSelection();
  };

  const startFill = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const state = spreadSheetStore.getState();
    const hasMultiSelection = Cells.selectedElements.length > 0;
    const anchor: CellCoord = {
      row: hasMultiSelection
        ? Cells.initialSelectionRow ?? state.currentRow
        : state.currentRow,
      col: hasMultiSelection
        ? Cells.initialSelectionColumn ?? state.currentColumn
        : state.currentColumn,
    };
    dragRef.current = {
      anchor,
      source: { row: state.currentRow, col: state.currentColumn },
    };

    // Make the existing selection machinery follow the cursor while dragging.
    startSelectionDrag(anchor.row, anchor.col);

    setDragging(true);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  if (!position.visible) return null;

  return (
    <div
      className="fill-handle"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        pointerEvents: dragging ? "none" : "auto",
      }}
      onMouseDown={startFill}
    />
  );
}
