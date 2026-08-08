import gsap from 'gsap';
import { getFocusableElements, trapDialogFocus } from "../lib/dialog.js";

export function initProam() {
  const section = document.querySelector('#proam');
  if (!section) return;

  const track = section.querySelector('[data-proam-track]');
  const cards = Array.from(section.querySelectorAll('[data-proam-open]'));
  const cursor = section.querySelector('[data-proam-cursor]');
  const lightbox = section.querySelector('[data-proam-lightbox]');
  const lightboxImage = section.querySelector('[data-proam-lightbox-image]');
  const lightboxTitle = section.querySelector('[data-proam-lightbox-title]');
  const closeEls = section.querySelectorAll('[data-proam-close]');
  const prevBtn = section.querySelector('[data-proam-speed="reverse"]');
  const nextBtn = section.querySelector('[data-proam-speed="forward"]');

  if (!track || !cards.length || !prevBtn || !nextBtn) return;

  let previousFocus = null;
  let previousOverflow = '';
  let cursorVisible = false;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const scroller = section.querySelector('[data-proam-track-wrap]');

  // Distance between two card origins, so a click advances exactly one card.
  const getStep = () => {
    if (cards.length < 2) return cards[0]?.getBoundingClientRect().width ?? 0;
    return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  };

  const scrollByStep = (direction) => {
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const target = gsap.utils.clamp(0, max, scroller.scrollLeft + direction * getStep());
    gsap.to(scroller, {
      scrollLeft: target,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true
    });
  };

  const goNext = () => scrollByStep(1);
  const goPrev = () => scrollByStep(-1);

  const canShowCursor = () =>
    Boolean(cursor && window.innerWidth > 980 && finePointer.matches);

  const placeCursor = (event) => {
    if (!canShowCursor()) return;
    gsap.set(cursor, { x: event.clientX, y: event.clientY });
  };

  const showCursor = (event) => {
    if (!canShowCursor()) return;
    placeCursor(event);
    if (cursorVisible) return;
    cursorVisible = true;
    gsap.to(cursor, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.16,
      ease: 'power2.out',
      overwrite: true
    });
  };

  const hideCursor = () => {
    if (!cursor) return;
    cursorVisible = false;
    gsap.to(cursor, {
      autoAlpha: 0,
      scale: 0.72,
      duration: 0.14,
      ease: 'power2.in',
      overwrite: true
    });
  };

  const moveCursor = (event) => {
    if (!canShowCursor()) return;
    placeCursor(event);
    if (!cursorVisible) showCursor(event);
  };

  const openLightbox = (card) => {
    const title = card.dataset.title || '';
    const image = card.dataset.image || '';

    if (lightboxTitle) lightboxTitle.textContent = title;

    if (lightboxImage) {
      lightboxImage.src = image;
      lightboxImage.alt = title;
    }

    if (lightbox) {
      previousFocus = card;
      previousOverflow = document.documentElement.style.overflow;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      const focusable = getFocusableElements(lightbox);
      (focusable[0] || lightbox)?.focus();
    }

    document.documentElement.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    }

    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus?.();
  };

  const viewport = scroller;
  if (cursor) {
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.72,
      autoAlpha: 0
    });
  }

  viewport?.addEventListener('pointermove', moveCursor);
  viewport?.addEventListener('pointerenter', showCursor);
  viewport?.addEventListener('pointerleave', hideCursor);
  window.addEventListener('scroll', hideCursor, { passive: true });

  // A swipe finishes with a click on whichever card sits under the finger, so
  // only treat it as a tap when neither the pointer nor the carousel moved.
  const DRAG_TOLERANCE = 10;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let scrollStart = 0;

  scroller?.addEventListener(
    'pointerdown',
    (event) => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      scrollStart = scroller.scrollLeft;
    },
    { passive: true }
  );

  const wasDragged = (event) =>
    Math.abs(event.clientX - pointerStartX) > DRAG_TOLERANCE ||
    Math.abs(event.clientY - pointerStartY) > DRAG_TOLERANCE ||
    Math.abs((scroller?.scrollLeft ?? 0) - scrollStart) > 2;

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      if (wasDragged(event)) return;
      openLightbox(card);
    });
  });

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  closeEls.forEach((el) => {
    el.addEventListener('click', closeLightbox);
  });

  window.addEventListener('keydown', (e) => {
    const lightboxOpen = lightbox?.classList.contains('is-open');
    if (lightboxOpen && e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (lightboxOpen) trapDialogFocus(lightbox, e);
  });

}
