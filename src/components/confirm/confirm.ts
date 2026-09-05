import { createContext, useContext } from "react";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  setBusy: (busy: boolean) => void;
  close: () => void;
}

export const ConfirmContext = createContext<ConfirmContextType>({
  confirm: async () => false,
  setBusy: () => {},
  close: () => {},
});

export function useConfirm(): ConfirmContextType {
  return useContext(ConfirmContext);
}
