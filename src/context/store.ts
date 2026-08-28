import type { OrgProduct } from "@/lib/orgTypes";
import { createStore } from "elk-components";

export const store = createStore<{
  cnt: number;
  busy: boolean;
  error: string;
  staticData: OrgProduct[];
}>({ cnt: 0, staticData: [], busy: false, error: "" });
export const spreadSheetStore = createStore<{
  formularValue: string;
  currentRow: number;
  currentColumn: number;
  isPasteButtonDissable?: boolean;
}>({
  formularValue: "",
  currentRow: 0,
  currentColumn: 0,
  isPasteButtonDissable: true,
});
