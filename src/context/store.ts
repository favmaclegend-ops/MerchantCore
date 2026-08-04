import type { Product } from "@/data/mockData";
import { createStore } from "elk-components";

export const store = createStore<{cnt: number, staticData: Product[]}>({ cnt: 0, staticData: [] });
export const spreadSheetStore = createStore<{
  formularValue: string;
  currentRow: number;
  currentColumn: number;
  
}>({ formularValue: '', currentRow: 0, currentColumn: 0 })