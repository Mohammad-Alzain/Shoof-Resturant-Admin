import type { KeyboardEvent } from "react";

/**
 * Keyboard activation for a clickable non-button element (role="button" or
 * "link" + tabIndex={0}): Enter and Space trigger its onClick. Ignores keys
 * pressed inside nested controls so they keep their own behaviour.
 */
export const onKeyActivate = (event: KeyboardEvent<HTMLElement>) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};
