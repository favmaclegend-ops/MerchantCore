export class Cells {
  static currentCell: HTMLInputElement;

  static setCurrentCell = (e: FocusEvent) => {
    Cells.currentCell = e.currentTarget as HTMLInputElement;
  };

  static getCurrentCell = () => {
    return Cells.currentCell;
  };
}

export const getCurrenCell = (e?: FocusEvent) => {
  Cells.setCurrentCell(e);
};

export const handleCellBold = () => {
  const currentCell = Cells.getCurrentCell();

  if (!currentCell) return;

  if (currentCell?.style.fontWeight === "bold") {
    currentCell.style.fontWeight = "normal";
  } else {
    currentCell.style.fontWeight = "bold";
  }
};

export const handleCellTextColor = (color: string) => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.color = color;
};
