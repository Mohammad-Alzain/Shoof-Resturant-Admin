import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Where a date picker's calendar is rendered. Inside the field it sits in the field's stacking context, so the next
 * field (animated, therefore its own layer) covered it. It is portalled instead into the open dialog / sheet (so
 * clicking a day doesn't count as a click outside and close the sheet) or else into <body>, on a layer above it all.
 */
export function DatePickerLayer({ children }: { children?: ReactNode }) {
  if (typeof document === "undefined") return <>{children}</>;
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"]');
  const host = dialogs.length ? dialogs[dialogs.length - 1] : document.body;
  return createPortal(<div className="datepicker-layer">{children}</div>, host);
}
