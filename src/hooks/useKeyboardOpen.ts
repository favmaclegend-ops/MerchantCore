import { useEffect, useState } from "react";

const FOCUSABLE = [
  "input:not([type=hidden])",
  "textarea",
  "select",
  "[contenteditable='true']",
];

/**
 * Returns true while a text-entry control has focus (i.e. the on-screen
 * keyboard is likely up). Used to hide/unmount fixed bottom UI (nav bar,
 * floating action buttons) so they can't overflow behind the iOS keyboard
 * and make the body scrollable.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      const isEditable =
        t &&
        typeof t.matches === "function" &&
        FOCUSABLE.some((sel) => t.matches(sel));
      if (isEditable) setOpen(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      const isEditable =
        t && typeof t.matches === "function" && FOCUSABLE.some((sel) => t.matches(sel));
      if (isEditable) setOpen(false);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return open;
}
