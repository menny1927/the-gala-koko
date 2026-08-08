import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { getFocusableElements, trapDialogFocus } from "../lib/dialog.js";

gsap.registerPlugin(ScrollTrigger);

export function initPastEventsScatter() {
  const gallery = document.querySelector(".peGallery");
  const heading = document.querySelector(".peHeading");
  const lightbox = document.querySelector("[data-pe-lightbox]");
  const lightboxImage = document.querySelector("[data-pe-lightbox-image]");
  const lightboxTitle = document.querySelector("[data-pe-lightbox-title]");
  const closeEls = document.querySelectorAll("[data-pe-close]");
  const footer = document.querySelector("#footer");

  if (!gallery || !heading) return;

  const CONFIG = {
    cardCount: 10,
    cardWidth: 250,
    cardHeight: 300,
    animationDuration: 0.75,
    animationOverlap: 0.5,
    headingFadeDuration: 0.5,
    headings: [
      "Moments that still shape the Gala",
      "Performances that changed the atmosphere",
      "Scenes that the evening still remembers",
      "A history written in movement and light"
    ],
    setsBasePath: "past-events"
  };

  const state = {
    activeCards: [],
    currentSection: 0,
    pendingSection: 0,
    isAnimating: false
  };
  let previousFocus = null;
  let previousOverflow = "";

  const openLightbox = (title, image, trigger) => {
    if (lightboxTitle) lightboxTitle.textContent = title || "Past event";

    if (lightboxImage) {
      lightboxImage.src = image;
      lightboxImage.alt = title || "Past event";
    }

    if (lightbox) {
      previousFocus = trigger;
      previousOverflow = document.documentElement.style.overflow;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
      const focusable = getFocusableElements(lightbox);
      (focusable[0] || lightbox)?.focus();
    }
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    }
  };

  closeEls.forEach((el) => el.addEventListener("click", closeLightbox));

  window.addEventListener("keydown", (e) => {
    const isOpen = lightbox?.classList.contains("is-open");
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (isOpen) trapDialogFocus(lightbox, e);
  });

  function animateHeading(timeline, newText) {
    timeline
      .to(heading, {
        opacity: 0,
        duration: CONFIG.headingFadeDuration,
        ease: "power2.inOut"
      }, 0)
      .call(() => {
        heading.textContent = newText;
      }, null, CONFIG.headingFadeDuration)
      .to(heading, {
        opacity: 1,
        duration: CONFIG.headingFadeDuration,
        ease: "power2.inOut"
      }, CONFIG.headingFadeDuration);
  }

  function getEdgePosition(centerX, centerY) {
    const distances = {
      left: centerX,
      right: window.innerWidth - centerX,
      top: centerY,
      bottom: window.innerHeight - centerY
    };

    const minDistance = Math.min(...Object.values(distances));
    const cardCenterOffsetX = CONFIG.cardWidth / 2;
    const cardCenterOffsetY = CONFIG.cardHeight / 2;
    const offsetVariation = (Math.random() - 0.5) * 450;

    if (minDistance === distances.left) {
      return {
        x: -300 - Math.random() * 240,
        y: centerY - cardCenterOffsetY + offsetVariation
      };
    }

    if (minDistance === distances.right) {
      return {
        x: window.innerWidth + 50 + Math.random() * 240,
        y: centerY - cardCenterOffsetY + offsetVariation
      };
    }

    if (minDistance === distances.top) {
      return {
        x: centerX - cardCenterOffsetX + offsetVariation,
        y: -400 - Math.random() * 240
      };
    }

    return {
      x: centerX - cardCenterOffsetX + offsetVariation,
      y: window.innerHeight + 50 + Math.random() * 240
    };
  }

  function createCards(setNumber) {
    const cards = [];
    const pad = 30;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const usableW = Math.max(1, W - pad * 2);
    const usableH = Math.max(1, H - pad * 2);
    const cellW = Math.max(CONFIG.cardWidth * 0.85, 160);
    const cellH = Math.max(CONFIG.cardHeight * 0.85, 180);
    const cols = Math.max(2, Math.floor(usableW / cellW));
    const rows = Math.max(2, Math.floor(usableH / cellH));

    const cells = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        cells.push({ r, c });
      }
    }

    gsap.utils.shuffle(cells);

    for (let i = 0; i < CONFIG.cardCount; i += 1) {
      const image = `/${CONFIG.setsBasePath}/set${setNumber}/img${i + 1}.webp`;
      const title = `Past event ${String(i + 1).padStart(2, "0")}`;

      const card = document.createElement("button");
      card.className = "peCard";
      card.type = "button";
      card.setAttribute("aria-label", `Open ${title}`);
      card.dataset.title = title;
      card.dataset.image = image;

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = title;
      img.src = image;

      card.appendChild(img);

      const cell = cells[i % cells.length];
      const baseX = pad + (cell.c + 0.5) * (usableW / cols);
      const baseY = pad + (cell.r + 0.5) * (usableH / rows);
      const jitterX = (Math.random() - 0.5) * (usableW / cols) * 0.9;
      const jitterY = (Math.random() - 0.5) * (usableH / rows) * 0.9;

      let centerX = baseX + jitterX;
      let centerY = baseY + jitterY;

      const minX = CONFIG.cardWidth / 2 + pad;
      const maxX = W - CONFIG.cardWidth / 2 - pad;
      const minY = CONFIG.cardHeight / 2 + pad;
      const maxY = H - CONFIG.cardHeight / 2 - pad;

      centerX = Math.min(maxX, Math.max(minX, centerX));
      centerY = Math.min(maxY, Math.max(minY, centerY));

      gsap.set(card, {
        left: centerX - CONFIG.cardWidth / 2,
        top: centerY - CONFIG.cardHeight / 2,
        rotation: Math.random() * 90 - 45
      });

      card.addEventListener("click", () => {
        openLightbox(title, image, card);
      });

      gallery.appendChild(card);

      cards.push({
        element: card,
        centerX,
        centerY
      });
    }

    return cards;
  }

  function animateCards(timeline, exitingCards, enteringCards) {
    exitingCards.forEach(({ element, centerX, centerY }) => {
      const targetEdge = getEdgePosition(centerX, centerY);

      timeline.to(
        element,
        {
          left: targetEdge.x,
          top: targetEdge.y,
          rotation: Math.random() * 180 - 90,
          duration: CONFIG.animationDuration,
          ease: "power2.in",
          onComplete: () => element.remove()
        },
        0
      );
    });

    enteringCards.forEach(({ element, centerX, centerY }) => {
      const targetEdge = getEdgePosition(centerX, centerY);

      gsap.set(element, {
        left: targetEdge.x,
        top: targetEdge.y,
        rotation: Math.random() * 180 - 90
      });

      timeline.to(
        element,
        {
          left: centerX - CONFIG.cardWidth / 2,
          top: centerY - CONFIG.cardHeight / 2,
          rotation: Math.random() * 90 - 45,
          duration: CONFIG.animationDuration,
          ease: "power2.out"
        },
        CONFIG.animationOverlap
      );
    });

  }

  function getSectionIndex(progress) {
    if (progress < 0.22) return 0;
    if (progress < 0.44) return 1;
    if (progress < 0.66) return 2;
    return 3;
  }

  function reinitialize() {
    state.activeCards.forEach(({ element }) => element.remove());
    state.activeCards = createCards(state.currentSection + 1);
  }

  function init() {
    state.activeCards = createCards(1);
    heading.textContent = CONFIG.headings[0];
    gsap.set(heading, { opacity: 1 });
  }

  init();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gallery.classList.add("is-static");
    return;
  }

  gallery.classList.add("is-scroll-sequence");
  footer?.classList.add("follows-pe-sequence");

  const transitionTo = (targetSection) => {
    state.pendingSection = targetSection;
    if (state.isAnimating || state.pendingSection === state.currentSection) return;

    state.isAnimating = true;
    const nextSection = state.pendingSection;
    const newCards = createCards(nextSection + 1);
    const timeline = gsap.timeline({
      onComplete: () => {
        state.activeCards = newCards;
        state.currentSection = nextSection;
        state.isAnimating = false;

        if (state.pendingSection !== state.currentSection) {
          transitionTo(state.pendingSection);
        }
      }
    });

    animateCards(timeline, state.activeCards, newCards);
    animateHeading(timeline, CONFIG.headings[nextSection]);
  };

  const renderExit = (progress) => {
    const exitProgress = gsap.utils.clamp(0, 1, (progress - 0.82) / 0.08);
    gsap.set(gallery, {
      autoAlpha: 1 - exitProgress,
      pointerEvents: exitProgress >= 0.98 ? "none" : "auto"
    });
  };

  const scrollTrigger = ScrollTrigger.create({
    trigger: gallery,
    start: "top top",
    end: () => `+=${window.innerHeight * 6}`,
    pin: true,
    pinSpacing: true,
    onUpdate: ({ progress }) => {
      const targetSection = getSectionIndex(progress);
      transitionTo(targetSection);
      renderExit(progress);
    },
    onEnter: () => renderExit(0),
    onEnterBack: ({ progress }) => renderExit(progress),
    onLeave: () => renderExit(1)
  });

  const onResize = () => {
    reinitialize();
    ScrollTrigger.refresh();
  };
  const onAnimationsReady = () => ScrollTrigger.refresh();

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("site:animations-ready", onAnimationsReady, { once: true });

  return () => {
    scrollTrigger.kill();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("site:animations-ready", onAnimationsReady);
    footer?.classList.remove("follows-pe-sequence");
  };
}
