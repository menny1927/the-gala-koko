import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initExperience() {
  const section = document.querySelector("#experience");
  if (!section) return;

  const stage = section.querySelector(".experienceStack__stage");
  const intro = section.querySelector(".experienceStack__intro");
  const reveal = section.querySelector(".experienceReveal");
  const cards = gsap.utils.toArray("[data-experience-card]", section);

  if (!stage || cards.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    section.classList.add("is-static");
    return;
  }

  const totalCards = cards.length;
  const transitionCount = totalCards - 1;
  const transitionStart = 0.14;
  const transitionEnd = 0.62;
  const lastCardHoldEnd = 0.8;
  const lastCardExitEnd = 0.93;
  const revealStart = 0.86;
  const segmentSize = (transitionEnd - transitionStart) / transitionCount;
  const cardYOffset = 5;
  const cardScaleStep = 0.075;
  const cardExitY = -215;

  const setInitialStack = () => {
    cards.forEach((card, index) => {
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50 + index * cardYOffset,
        scale: 1 - index * cardScaleStep,
        rotationX: 0,
        autoAlpha: 1
      });
    });
  };

  const setExited = (card) => {
    gsap.set(card, {
      yPercent: cardExitY,
      rotationX: 28,
      scale: 1,
      autoAlpha: 1
    });
  };

  const setLastCardAtRest = () => {
    cards.slice(0, -1).forEach(setExited);
    gsap.set(cards[totalCards - 1], {
      yPercent: -50,
      rotationX: 0,
      scale: 1,
      autoAlpha: 1
    });
  };

  setInitialStack();
  gsap.set(cards, { autoAlpha: 0 });
  if (intro) gsap.set(intro, { autoAlpha: 1 });
  if (reveal) gsap.set(reveal, { autoAlpha: 0 });

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${window.innerHeight * 3.6}`,
    pin: true,
    pinSpacing: true,
    scrub: 0.8,
    invalidateOnRefresh: true,
    onUpdate: ({ progress }) => {
      if (progress < transitionStart) {
        setInitialStack();
        const cardRevealProgress = gsap.utils.clamp(
          0,
          1,
          (progress - 0.04) / 0.05
        );
        gsap.set(cards, { autoAlpha: cardRevealProgress });
      } else if (progress <= transitionEnd) {
        const transitionProgress = progress - transitionStart;
        const activeIndex = Math.min(
          Math.floor(transitionProgress / segmentSize),
          transitionCount - 1
        );
        const segmentProgress = gsap.utils.clamp(
          0,
          1,
          (transitionProgress - activeIndex * segmentSize) / segmentSize
        );

        cards.forEach((card, index) => {
          if (index < activeIndex) {
            setExited(card);
            return;
          }

          if (index === activeIndex) {
            gsap.set(card, {
              yPercent: gsap.utils.interpolate(-50, cardExitY, segmentProgress),
              rotationX: gsap.utils.interpolate(0, 28, segmentProgress),
              scale: 1,
              autoAlpha: 1
            });
            return;
          }

          const depth = index - activeIndex - segmentProgress;
          gsap.set(card, {
            yPercent: -50 + depth * cardYOffset,
            rotationX: 0,
            scale: 1 - depth * cardScaleStep,
            autoAlpha: 1
          });
        });
      } else if (progress <= lastCardHoldEnd) {
        setLastCardAtRest();
      } else if (progress <= lastCardExitEnd) {
        const exitProgress = gsap.utils.clamp(
          0,
          1,
          (progress - lastCardHoldEnd) / (lastCardExitEnd - lastCardHoldEnd)
        );

        cards.slice(0, -1).forEach(setExited);
        gsap.set(cards[totalCards - 1], {
          yPercent: gsap.utils.interpolate(-50, cardExitY, exitProgress),
          rotationX: gsap.utils.interpolate(0, 28, exitProgress),
          scale: 1,
          autoAlpha: 1
        });
      } else {
        cards.forEach(setExited);
      }

      if (intro) {
        const introProgress = gsap.utils.clamp(0, 1, progress / 0.08);
        gsap.set(intro, { autoAlpha: 1 - introProgress });
      }

      if (reveal) {
        const revealProgress = gsap.utils.clamp(
          0,
          1,
          (progress - revealStart) / (1 - revealStart)
        );
        gsap.set(reveal, { autoAlpha: revealProgress });
      }
    }
  });

  const onResize = () => ScrollTrigger.refresh();
  const onAnimationsReady = () => ScrollTrigger.refresh();
  window.addEventListener("resize", onResize);
  window.addEventListener("site:animations-ready", onAnimationsReady, { once: true });

  return () => {
    trigger.kill();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("site:animations-ready", onAnimationsReady);
  };
}
