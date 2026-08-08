import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let configured = false;

/**
 * One-time ScrollTrigger tuning applied before any section initialises.
 * Without this, pinned/scrubbed sections stutter: mobile browsers resize the
 * viewport when the address bar hides, and touch scroll arrives in coarse
 * irregular chunks that ScrollTrigger otherwise samples directly.
 */
export function configureScrollSmoothing() {
  if (configured) return;
  configured = true;

  // A viewport resize mid-scroll (address bar hiding) would otherwise trigger a
  // full refresh and make pinned sections jump.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Let ScrollTrigger drive touch scrolling from its own ticker rather than
  // reacting to raw touch events — this is what removes the bumpiness.
  // `momentum` is kept low so the page settles as soon as the finger lifts
  // instead of gliding on for another chunk of scroll.
  if (ScrollTrigger.isTouch === 1) {
    ScrollTrigger.normalizeScroll({ allowNestedScroll: true, momentum: 0.4 });
  }
}
