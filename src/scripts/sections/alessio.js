import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(SplitText);

export function initAlessio() {
  const root = document.querySelector(".alessio-page");
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const lenis = new Lenis();
  let rafId = 0;

  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);
  const cardContainers = root.querySelectorAll(".alessio-card-container");
  const cleanups = [];

  cardContainers.forEach((cardContainer) => {
    const cardPaths = cardContainer.querySelectorAll(".alessio-svg-stroke path");
    const cardTitle = cardContainer.querySelector(".alessio-card-title h3");

    if (!cardPaths.length || !cardTitle) return;

    const split = SplitText.create(cardTitle, {
      type: "words",
      mask: "words",
      wordsClass: "word",
    });

    gsap.set(split.words, { yPercent: 100 });

    cardPaths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    });

    let tl;

    const onEnter = () => {
      if (tl) tl.kill();
      tl = gsap.timeline();

      cardPaths.forEach((path) => {
        tl.to(
          path,
          {
            strokeDashoffset: 0,
            attr: { "stroke-width": 700 },
            duration: 1.5,
            ease: "power2.out",
          },
          0
        );
      });

      tl.to(
        split.words,
        {
          yPercent: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.075,
        },
        0.35
      );
    };

    const onLeave = () => {
      if (tl) tl.kill();
      tl = gsap.timeline();

      cardPaths.forEach((path) => {
        const length = path.getTotalLength();
        tl.to(
          path,
          {
            strokeDashoffset: length,
            attr: { "stroke-width": 200 },
            duration: 1,
            ease: "power2.out",
          },
          0
        );
      });

      tl.to(
        split.words,
        {
          yPercent: 100,
          duration: 0.5,
          ease: "power3.out",
          stagger: { each: 0.05, from: "end" },
        },
        0
      );
    };

    cardContainer.addEventListener("mouseenter", onEnter);
    cardContainer.addEventListener("mouseleave", onLeave);
    cardContainer.addEventListener("focusin", onEnter);
    cardContainer.addEventListener("focusout", onLeave);

    cleanups.push(() => {
      tl?.kill();
      split.revert();
      cardContainer.removeEventListener("mouseenter", onEnter);
      cardContainer.removeEventListener("mouseleave", onLeave);
      cardContainer.removeEventListener("focusin", onEnter);
      cardContainer.removeEventListener("focusout", onLeave);
    });
  });

  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
    cleanups.forEach((cleanup) => cleanup());
  };
}
