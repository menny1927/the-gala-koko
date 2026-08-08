export  function initTesto() {
  const section = document.querySelector(".testo");
  if (!section) return;

  const inner = section.querySelector(".testo-inner");
  const cursor = section.querySelector(".testo-cursor");
  const lines = Array.from(section.querySelectorAll("[data-line]"));
  const textNodes = Array.from(section.querySelectorAll("[data-text]"));

  if (!inner || !cursor || !lines.length || !textNodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    section.classList.add("is-reduced");
    lines.forEach((line) => line.classList.add("is-on"));
    return;
  }

  // Wrap every character in a span so we can "hit test" letters.
  textNodes.forEach((el) => {
    const str = el.textContent ?? "";
    el.textContent = "";

    for (const ch of str) {
      const span = document.createElement("span");
      span.className = "testo-ch";
      span.textContent = ch;
      el.appendChild(span);
    }
  });

  const chars = Array.from(section.querySelectorAll(".testo-ch"));

  // Cursor tracking
  let active = false;
  let cx = 0,
    cy = 0; // smoothed cursor (viewport coords)
  let tx = 0,
    ty = 0; // target cursor (viewport coords)

  const r = 45; // 40px diameter

  function setActive(on) {
    active = on;
    section.classList.toggle("is-active", on);
    cursor.style.opacity = on ? "1" : "0";
    if (!on) cursor.style.transform = "translate(-9999px, -9999px)";
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
    },
    { passive: true }
  );

  // Scroll-based line reveal
  function updateLines() {
    const rect = section.getBoundingClientRect();
    const viewH = window.innerHeight;

    // progress 0..1 while section passes viewport
    const start = viewH * 0.35;
    const end = viewH * 0.65;

    const denom = rect.height - (start + (viewH - end));
    const t = denom === 0 ? 0 : (start - rect.top) / denom;
    const progress = Math.max(0, Math.min(1, t));

    const onCount = Math.floor(progress * (lines.length + 0.999));

    lines.forEach((line, i) => {
      line.classList.toggle("is-on", i < onCount);
    });

    // Only enable the custom cursor while section is in view
    const inView = rect.top < viewH && rect.bottom > 0;
    setActive(inView);
  }

  function hitTestLetters() {
    if (!active) return;

    // Smooth cursor
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;

    // Cursor is ABSOLUTE inside .testo-inner, so convert viewport -> inner coords
    const ir = inner.getBoundingClientRect();
    const x = cx - ir.left;
    const y = cy - ir.top;
    cursor.style.transform = `translate(${x - r}px, ${y - r}px)`;

    // Clear hits
    for (const ch of chars) ch.classList.remove("is-hit");

    // Hit test: char center within circle radius (in viewport space)
    for (const ch of chars) {
      const b = ch.getBoundingClientRect();
      const mx = b.left + b.width / 2;
      const my = b.top + b.height / 2;
      const dx = mx - cx;
      const dy = my - cy;
      if (dx * dx + dy * dy <= r * r) ch.classList.add("is-hit");
    }
  }

  function raf() {
    hitTestLetters();
    requestAnimationFrame(raf);
  }

  window.addEventListener("scroll", updateLines, { passive: true });
  window.addEventListener("resize", updateLines, { passive: true });

  updateLines();
  requestAnimationFrame(raf);
}
