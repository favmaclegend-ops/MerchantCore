import { useCallback, useRef, useState, type ReactNode } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { ConfirmContext, type ConfirmOptions } from "./confirm";

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "Are you sure?",
  });
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setBusy(false);
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    if (busy) return;
    setOpen(false);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, [busy]);

  return (
    <ConfirmContext.Provider value={{ confirm, setBusy, close }}>
      {children}
      <ConfirmDialog
        open={open}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={close}
      />
    </ConfirmContext.Provider>
  );
}
