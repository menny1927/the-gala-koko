const ENTERED_KEY = "gala:entered";

const hasEntered = () => {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch (error) {
    return false;
  }
};

const rememberEntered = () => {
  try {
    sessionStorage.setItem(ENTERED_KEY, "1");
  } catch (error) {
    /* storage unavailable — the gate simply shows again next navigation */
  }
};

export function initKnockGate() {
  const gate = document.querySelector("#knockGate");
  if (!gate) return;

  // Navigating back to the homepage in the same session shouldn't re-gate.
  if (hasEntered()) {
    gate.remove();
    return;
  }

  const cursor = document.querySelector("#knockCursor");
  const label = document.querySelector("#knockCursorText");
  const heroImg = document.querySelector("#knockGlove");
  const goesWord = gate.querySelector('[data-knock-word="goes"]');
  const kokoWord = gate.querySelector('[data-knock-word="koko"]');
  if (!cursor || !label) return;

  const prevOverflow = document.documentElement.style.overflow;
  const previousFocus = document.activeElement;
  document.documentElement.style.overflow = "hidden";
  gate.focus();

  cursor.style.opacity = "1";
  label.style.opacity = "1";

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let raf = 0;

  const update = () => {
    raf = 0;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-20%, -20%)`;
    label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(42px, 38px)`;
  };

  const requestUpdate = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(update);
  };

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    requestUpdate();
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("mousemove", onMove);

  function pulse() {
    if (!heroImg) return;
    heroImg.animate(
      [
        { transform: "translateY(0) rotate(0deg) scale(1)" },
        { transform: "translateY(10px) rotate(-2deg) scale(0.985)" },
        { transform: "translateY(0) rotate(0deg) scale(1)" },
      ],
      { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }

  let knocks = 0;
  let unlocked = false;

  function cleanup() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("mousemove", onMove);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;

    cleanup();
    rememberEntered();
    document.documentElement.style.overflow = prevOverflow || "";

    // Scroll was locked while the gate was up, so any scroll-driven animation
    // (the pinned hero) measured against a non-scrollable page. Let listeners
    // recalculate now that the page can scroll again.
    window.dispatchEvent(new Event("site:gate-unlocked"));

    gate.style.transition = "opacity 450ms ease, visibility 450ms ease";
    gate.style.opacity = "0";
    gate.style.visibility = "hidden";
    gate.style.pointerEvents = "none";

    window.setTimeout(() => {
      gate.remove();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      previousFocus?.focus?.();
      window.dispatchEvent(new Event("site:gate-unlocked"));
    }, 480);
  }

  function doKnock() {
    if (unlocked) return;
    knocks += 1;
    gate.dataset.knocks = String(knocks);
    pulse();

    if (knocks === 1) goesWord?.classList.add("is-visible");
    if (knocks === 2) kokoWord?.classList.add("is-visible");

    const remaining = Math.max(0, 3 - knocks);
    label.textContent =
      remaining === 0
        ? "Welcome"
        : `${remaining} ${remaining === 1 ? "knock" : "knocks"} remaining`;
    if (knocks >= 3) unlock();
  }

  gate.addEventListener("click", (e) => {
    e.preventDefault();
    doKnock();
  });

  gate.addEventListener(
    "keydown",
    (e) => {
      if (unlocked) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        doKnock();
      }
    },
    { passive: false }
  );

  requestUpdate();
}
