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
  const cardExitRotation = 28;

  // Resting position of a card sitting `depth` places back in the stack.
  const depthY = (depth) => -50 + depth * cardYOffset;
  const depthScale = (depth) => 1 - depth * cardScaleStep;

  cards.forEach((card, index) => {
    gsap.set(card, {
      xPercent: -50,
      yPercent: depthY(index),
      scale: depthScale(index),
      rotationX: 0,
      autoAlpha: 0
    });
  });

  if (intro) gsap.set(intro, { autoAlpha: 1 });
  if (reveal) gsap.set(reveal, { autoAlpha: 0 });

  // A single scrubbed timeline whose duration maps 1:1 onto scroll progress.
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * 3.6}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.75,
      invalidateOnRefresh: true
    }
  });

  if (intro) timeline.to(intro, { autoAlpha: 0, duration: 0.08 }, 0);
  timeline.to(cards, { autoAlpha: 1, duration: 0.05 }, 0.04);

  // Each step lifts the front card away and pulls the rest one place forward.
  for (let i = 0; i < transitionCount; i += 1) {
    const at = transitionStart + i * segmentSize;

    timeline.to(
      cards[i],
      { yPercent: cardExitY, rotationX: cardExitRotation, scale: 1, duration: segmentSize },
      at
    );

    for (let j = i + 1; j < totalCards; j += 1) {
      const depth = j - i - 1;
      timeline.to(
        cards[j],
        { yPercent: depthY(depth), scale: depthScale(depth), duration: segmentSize },
        at
      );
    }
  }

  timeline.to(
    cards[totalCards - 1],
    {
      yPercent: cardExitY,
      rotationX: cardExitRotation,
      duration: lastCardExitEnd - lastCardHoldEnd
    },
    lastCardHoldEnd
  );

  if (reveal) {
    timeline.to(reveal, { autoAlpha: 1, duration: 1 - revealStart }, revealStart);
  }

  // Pad the timeline so its duration is exactly 1 and matches scroll progress.
  timeline.to({}, { duration: 0 }, 1);

  const onAnimationsReady = () => ScrollTrigger.refresh();
  window.addEventListener("site:animations-ready", onAnimationsReady, { once: true });

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    window.removeEventListener("site:animations-ready", onAnimationsReady);
  };
}
