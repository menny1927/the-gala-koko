import { getFocusableElements, trapDialogFocus } from "../lib/dialog.js";

export function initRequestPopup() {
  const openButtons = document.querySelectorAll("[data-request-open]");
  const overlay = document.querySelector("#request-overlay");
  if (!openButtons.length || !overlay) return;

  const closeBtn = overlay.querySelector(".request-overlay__close");
  const backdrop = overlay.querySelector(".request-overlay__backdrop");
  const panel = overlay.querySelector(".request-overlay__panel");
  let previousFocus = null;
  let previousOverflow = "";

  const open = (event) => {
    previousFocus = event?.currentTarget || document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    const focusable = getFocusableElements(overlay);
    (focusable[0] || panel)?.focus();
  };

  const close = () => {
    if (!overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus?.();
  };

  openButtons.forEach((button) => button.addEventListener("click", open));
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    trapDialogFocus(overlay, event);
  });
}
