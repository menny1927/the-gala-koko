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

const initHorizontalStory = (hero) => {
  const horizontal = hero.querySelector("[data-hero-horizontal]");
  const track = hero.querySelector("[data-hero-track]");
  const panels = [...(track?.querySelectorAll("[data-hero-concept]") ?? [])];
  const progressItems = [...hero.querySelectorAll("[data-hero-progress-item]")];

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
  const hold = () => Math.max(320, horizontal.clientWidth * 0.4);
  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;
  // Snapping keeps cards from resting halfway, so the pinned distance no
  // longer needs to be stretched much to keep them readable.
  const scrollFactor = () => (isMobile() ? 1.15 : 1);

  // The cards travel for most of the pin, then hold briefly before releasing.
  const moveShare = 0.85;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: horizontal,
      start: "top top",
      end: () => `+=${(travel() + hold()) * scrollFactor()}`,
      pin: true,
      // Snap already settles the cards, so on mobile the track can track the
      // finger closely instead of easing in for another three-quarters of a
      // second after each snap.
      scrub: isMobile() ? 0.3 : 0.75,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      // Mobile: settle on whole cards so the track never rests halfway between
      // two of them. The trailing hold stays free-scrolling.
      snap: {
        snapTo: (value) => {
          if (!isMobile()) return value;

          const moveProgress = value / moveShare;
          if (moveProgress <= 0 || moveProgress >= 1) return value;

          const steps = panels.length - 1;
          return (Math.round(moveProgress * steps) / steps) * moveShare;
        },
        duration: { min: 0.1, max: 0.25 },
        delay: 0.02,
        ease: "power2.out",
      },
      onUpdate: ({ progress }) => {
        updateProgress(progress / moveShare);
      },
    },
  });

  // The cards travel horizontally, then hold.
  tl.to(track, { x: () => -travel(), duration: moveShare, ease: "none" }, 0);
  tl.to({}, { duration: 1 - moveShare });

  updateProgress(0);

  const cinematic = hero.querySelector('[data-hero-concept="cinematic"]');
  if (cinematic) {
    // No scroll-reveal on the first card — it is visible as soon as the section
    // pins, and a reversible reveal would blank its text when scrolling back up.
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
          scrub: 0.75,
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
            scrub: 0.75,
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
    initHorizontalStory(hero);
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
