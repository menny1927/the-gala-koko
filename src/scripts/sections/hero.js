import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const playVisibleVideos = (hero, reduceMotion) => {
  const videos = [...hero.querySelectorAll("[data-hero-video]")];
  if (!videos.length || reduceMotion) {
    videos.forEach((video) => video.pause());
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!(target instanceof HTMLVideoElement)) return;
        if (isIntersecting) {
          target.play().catch(() => {});
        } else {
          target.pause();
        }
      });
    },
    { rootMargin: "20% 0px", threshold: 0.08 }
  );

  videos.forEach((video) => observer.observe(video));
  return () => observer.disconnect();
};

const revealConcept = (concept, scrollTrigger, extra = {}) => {
  const copy = concept.querySelector("[data-hero-copy]");
  const media = concept.querySelector("[data-hero-media]");
  const items = concept.querySelector("[data-hero-items]");

  const timeline = gsap.timeline({
    defaults: { duration: 1.05, ease: "power3.out" },
    scrollTrigger,
  });

  if (copy) timeline.fromTo(copy, { y: 72, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0);
  if (media) {
    timeline.fromTo(
      media,
      { clipPath: "inset(12% 12% 12% 12%)", scale: 0.94, autoAlpha: 0 },
      { clipPath: "inset(0% 0% 0% 0%)", scale: 1, autoAlpha: 1 },
      0.13
    );
  }
  if (items) timeline.fromTo(items, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0.28);
  if (extra.onTimeline) extra.onTimeline(timeline);

  return timeline;
};

const initOpeningStory = (hero) => {
  const horizontal = hero.querySelector("[data-hero-horizontal]");
  const track = hero.querySelector("[data-hero-track]");
  const opening = hero.querySelector("[data-hero-opening]");
  const panels = [...(track?.querySelectorAll("[data-hero-concept]") ?? [])];
  const progressItems = [...hero.querySelectorAll("[data-hero-progress-item]")];
  const progressNav = hero.querySelector("[data-hero-progress]");

  if (!horizontal || !track || panels.length < 2) return;

  let activeIndex = -1;
  const updateProgress = (progress) => {
    const bounded = gsap.utils.clamp(0, 1, progress);
    horizontal.style.setProperty("--hero-progress", bounded.toFixed(4));

    const nextIndex = Math.min(panels.length - 1, Math.round(bounded * (panels.length - 1)));
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;

    progressItems.forEach((item, index) => {
      const isActive = index === activeIndex;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
  };

  const travel = () => Math.max(0, track.scrollWidth - horizontal.clientWidth);
  const introLen = () => window.innerHeight * 1.35;
  const hold = () => Math.max(320, horizontal.clientWidth * 0.4);
  // Mobile: stretch the pinned distance so each card needs more scrolling
  const scrollFactor = () => (window.matchMedia("(max-width: 760px)").matches ? 1.7 : 1);

  // Fixed timeline split — light opening → horizontal card travel → hold.
  // Kept as constants (not derived from build-time pixel measurements) so the
  // timeline is always well-formed even if it is built before layout settles.
  const introShare = 0.22;
  const moveShare = 0.7;

  // One pinned timeline so the light and the cards live in the exact same view.
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: horizontal,
      start: "top top",
      end: () => `+=${(introLen() + travel() + hold()) * scrollFactor()}`,
      pin: true,
      scrub: 0.3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        updateProgress(moveShare ? (progress - introShare) / moveShare : 0);
      },
    },
  });

  // --- Phase 1: theatre lights rise, the logo appears, then it all dissolves ---
  const I = introShare;
  const halo = opening?.querySelector("[data-hero-halo]");
  const beam = opening?.querySelector("[data-hero-beam]");
  const dust = opening?.querySelector("[data-hero-dust]");
  const pool = opening?.querySelector("[data-hero-pool]");
  const brand = opening?.querySelector("[data-hero-light-brand]");
  const prompt = opening?.querySelector("[data-hero-light-prompt]");
  const smoke = opening ? [...opening.querySelectorAll("[data-hero-smoke]")] : [];

  if (prompt) tl.to(prompt, { autoAlpha: 0, y: 12, duration: 0.05 * I }, 0);
  if (halo) tl.fromTo(halo, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 0.9, scale: 1, duration: 0.4 * I, ease: "power2.out" }, 0);
  if (beam) tl.fromTo(beam, { autoAlpha: 0 }, { autoAlpha: 0.85, duration: 0.4 * I, ease: "power2.inOut" }, 0.03 * I);
  if (smoke.length) tl.fromTo(smoke, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.42 * I, ease: "power1.out" }, 0.04 * I);
  if (pool) tl.fromTo(pool, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 0.8, scale: 1, duration: 0.36 * I, ease: "power2.out" }, 0.12 * I);
  if (dust) tl.fromTo(dust, { autoAlpha: 0 }, { autoAlpha: 0.42, duration: 0.28 * I, ease: "power1.out" }, 0.16 * I);
  if (brand) tl.fromTo(brand, { autoAlpha: 0, y: 34, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.16 * I, ease: "power3.out" }, 0.34 * I);
  // hold on the logo, then dissolve the opening so the first card is revealed in place
  if (brand) tl.to(brand, { autoAlpha: 0, y: -46, scale: 0.99, duration: 0.14 * I, ease: "power2.in" }, 0.74 * I);
  if (opening) tl.to(opening, { autoAlpha: 0, duration: 0.2 * I, ease: "power1.inOut" }, 0.82 * I);
  if (progressNav) tl.fromTo(progressNav, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 * I, ease: "power1.out" }, 0.86 * I);

  // --- Phase 2: the four cards travel horizontally, then hold ---
  tl.to(track, { x: () => -travel(), duration: moveShare, ease: "none" }, introShare);
  tl.to({}, { duration: Math.max(0.001, 1 - introShare - moveShare) });

  updateProgress(0);

  const cinematic = hero.querySelector('[data-hero-concept="cinematic"]');
  if (cinematic) {
    // No scroll-reveal on the first card — the opening dissolve already reveals
    // it, and a reversible reveal would blank its text when scrolling back up.
    const backdrop = cinematic.querySelector("[data-hero-parallax]");
    if (backdrop) {
      gsap.to(backdrop, {
        xPercent: 3,
        scale: 1.16,
        ease: "none",
        scrollTrigger: {
          trigger: cinematic,
          containerAnimation: tl,
          start: "left left",
          end: "right left",
          scrub: true,
        },
      });
    }
  }

  const editorial = hero.querySelector('[data-hero-concept="editorial"]');
  if (editorial) {
    revealConcept(editorial, {
      trigger: editorial,
      containerAnimation: tl,
      start: "left 74%",
      toggleActions: "play none none reverse",
    });
  }

  const clash = hero.querySelector('[data-hero-concept="clash"]');
  if (clash) {
    const titleTop = clash.querySelector(".heroClash__titleTop");
    const titleBottom = clash.querySelector(".heroClash__titleBottom");
    const copy = clash.querySelector("[data-hero-copy]");
    const left = clash.querySelector("[data-hero-left]");
    const right = clash.querySelector("[data-hero-right]");
    const facts = clash.querySelector("[data-hero-items]");

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: clash,
        containerAnimation: tl,
        start: "left 72%",
        toggleActions: "play none none reverse",
      },
    });

    if (left) {
      timeline.fromTo(
        left,
        { x: -140, rotate: -12, autoAlpha: 0 },
        { x: 0, rotate: -4, autoAlpha: 1, duration: 1.15, ease: "power3.out" },
        0
      );
    }
    if (right) {
      timeline.fromTo(
        right,
        { x: 140, rotate: 12, autoAlpha: 0 },
        { x: 0, rotate: 4, autoAlpha: 1, duration: 1.15, ease: "power3.out" },
        0
      );
    }
    if (titleTop) {
      timeline.fromTo(
        titleTop,
        { xPercent: -25, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power4.out" },
        0.15
      );
    }
    if (titleBottom) {
      timeline.fromTo(
        titleBottom,
        { xPercent: 25, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power4.out" },
        0.15
      );
    }
    if (copy) {
      timeline.fromTo(
        copy.querySelectorAll(":scope > :not(h2)"),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.75 },
        0.45
      );
    }
    if (facts) timeline.fromTo(facts, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.65);

    const orbit = clash.querySelector("[data-hero-orbit]");
    if (orbit) {
      gsap.to(orbit, {
        rotation: 40,
        ease: "none",
        scrollTrigger: {
          trigger: clash,
          containerAnimation: tl,
          start: "left right",
          end: "right left",
          scrub: 0.3,
        },
      });
    }
  }

  const stage = hero.querySelector('[data-hero-concept="stage"]');
  if (stage) {
    // No slide-in reveal on this card — content sits in place; only the
    // framed image keeps a gentle scale parallax as it passes through.
    const stageImage = stage.querySelector(".heroStage__window img");
    if (stageImage) {
      gsap.fromTo(
        stageImage,
        { scale: 1.14 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            containerAnimation: tl,
            start: "left right",
            end: "right left",
            scrub: 0.3,
          },
        }
      );
    }
  }
};

const initInvitation = (hero) => {
  const invitation = hero.querySelector('[data-hero-concept="invitation"]');
  if (!invitation) return;

  const copy = invitation.querySelector("[data-hero-copy]");
  const date = invitation.querySelector("[data-hero-date]");
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: invitation, start: "top 70%", toggleActions: "play none none reverse" },
  });

  if (copy) {
    timeline.fromTo(
      copy,
      { scale: 0.9, autoAlpha: 0, filter: "blur(14px)" },
      { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1.25, ease: "power3.out" },
      0
    );
  }
  if (date) {
    timeline.fromTo(
      date.children,
      { xPercent: 35, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, stagger: 0.1, duration: 1.1, ease: "power3.out" },
      0.18
    );
  }

  const spotlight = invitation.querySelector("[data-hero-spotlight]");
  if (spotlight) {
    gsap.to(spotlight, {
      scale: 1.3,
      opacity: 0.55,
      ease: "none",
      scrollTrigger: { trigger: invitation, start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  const backdrop = invitation.querySelector("[data-hero-parallax]");
  if (backdrop) {
    gsap.to(backdrop, {
      yPercent: 9,
      scale: 1.14,
      ease: "none",
      scrollTrigger: { trigger: invitation, start: "top bottom", end: "bottom top", scrub: true },
    });
  }
};

export function initHero() {
  const hero = document.querySelector("#hero");
  if (!hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stopVideos = playVisibleVideos(hero, reduceMotion);

  if (reduceMotion) {
    hero.classList.add("is-reduced");
    return stopVideos;
  }

  const context = gsap.context(() => {
    initOpeningStory(hero);
    initInvitation(hero);
  }, hero);

  // The knock gate locks scrolling while the hero pin is measured, so recompute
  // the pinned trigger once scrolling is handed back.
  const onGateUnlocked = () => ScrollTrigger.refresh();
  window.addEventListener("site:gate-unlocked", onGateUnlocked);

  return () => {
    stopVideos();
    window.removeEventListener("site:gate-unlocked", onGateUnlocked);
    context.revert();
  };
}
