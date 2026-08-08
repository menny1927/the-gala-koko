// src/scripts/sections/koko.js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


export function initKoko() {
  const koko = document.querySelector(".koko");
  if (!koko) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    koko.classList.add("is-static");
    return;
  }

  const kokoImg = koko.querySelector(".koko-img");
  const kokoImgEl = koko.querySelector(".koko-img-el");
  const kokoMask = koko.querySelector(".koko-mask");
  const kokoGrid = koko.querySelector(".koko-grid-overlay");
  const marker1 = koko.querySelector(".koko-marker-1");
  const marker2 = koko.querySelector(".koko-marker-2");
  const kokoContent = koko.querySelector(".koko-content");
  const progressBar = koko.querySelector(".koko-scroll-progress-bar");

  if (
    !kokoImg ||
    !kokoImgEl ||
    !kokoMask ||
    !kokoGrid ||
    !marker1 ||
    !marker2 ||
    !kokoContent ||
    !progressBar
  )
    return;

  const ease = (x) => x * x * (3 - 2 * x);

  const measure = () => {
    const viewportHeight = window.innerHeight;
    const contentMove = kokoContent.offsetHeight - viewportHeight;
    const imgMove = kokoImg.offsetHeight - viewportHeight;
    return { contentMove, imgMove };
  };

  let m = measure();

  window.addEventListener("resize", () => {
    m = measure();
    ScrollTrigger.refresh();
  });

  ScrollTrigger.create({
    trigger: ".koko",
    start: "top top",
    end: () => `+=${window.innerHeight * 4}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      gsap.set(progressBar, { "--progress": self.progress });

      gsap.set(kokoContent, { y: -self.progress * m.contentMove });

      let imgProgress;
      if (self.progress <= 0.45) {
        imgProgress = ease(self.progress / 0.45) * 0.65;
      } else if (self.progress <= 0.75) {
        imgProgress = 0.65;
      } else {
        imgProgress = 0.65 + ease((self.progress - 0.75) / 0.25) * 0.35;
      }

      gsap.set(kokoImg, { y: imgProgress * m.imgMove });

      let maskScale;
      let imgSaturation;
      let overlayOpacity;

      // Keep full colour throughout (the map is a dark vector, so the old
      // grayscale + heavy dim made it disappear when zoomed in).
      imgSaturation = 1;

      if (self.progress <= 0.4) {
        maskScale = 2.5;
        overlayOpacity = 0.3;
      } else if (self.progress <= 0.5) {
        const phase = ease((self.progress - 0.4) / 0.1);
        maskScale = 2.5 - phase * 1.5;
        overlayOpacity = 0.3 + phase * 0.08;
      } else if (self.progress <= 0.75) {
        maskScale = 1;
        overlayOpacity = 0.38;
      } else if (self.progress <= 0.85) {
        const phase = ease((self.progress - 0.75) / 0.1);
        maskScale = 1 + phase * 1.5;
        overlayOpacity = 0.38 - phase * 0.08;
      } else {
        maskScale = 2.5;
        overlayOpacity = 0.3;
      }

      gsap.set(kokoMask, { scale: maskScale });
      gsap.set(kokoImgEl, { filter: `saturate(${imgSaturation})` });
      gsap.set(kokoImg, { "--overlay-opacity": overlayOpacity });

      let gridOpacity;
      if (self.progress <= 0.475) gridOpacity = 0;
      else if (self.progress <= 0.5) gridOpacity = ease((self.progress - 0.475) / 0.025);
      else if (self.progress <= 0.75) gridOpacity = 1;
      else if (self.progress <= 0.775) gridOpacity = 1 - ease((self.progress - 0.75) / 0.025);
      else gridOpacity = 0;

      gsap.set(kokoGrid, { opacity: gridOpacity });

      let m1;
      if (self.progress <= 0.5) m1 = 0;
      else if (self.progress <= 0.525) m1 = ease((self.progress - 0.5) / 0.025);
      else if (self.progress <= 0.7) m1 = 1;
      else if (self.progress <= 0.75) m1 = 1 - ease((self.progress - 0.7) / 0.05);
      else m1 = 0;

      gsap.set(marker1, { opacity: m1 });

      let m2;
      if (self.progress <= 0.55) m2 = 0;
      else if (self.progress <= 0.575) m2 = ease((self.progress - 0.55) / 0.025);
      else if (self.progress <= 0.7) m2 = 1;
      else if (self.progress <= 0.75) m2 = 1 - ease((self.progress - 0.7) / 0.05);
      else m2 = 0;

      gsap.set(marker2, { opacity: m2 });
    },
  });
}
