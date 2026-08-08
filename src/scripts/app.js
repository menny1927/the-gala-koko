import { safeInit } from "./lib/safeInit.js";

const features = [
  {
    selector: "#knockGate",
    name: "knockGate",
    load: () => import("./sections/knockGate.js"),
    init: "initKnockGate",
  },
  {
    selector: "#hero",
    name: "hero",
    load: () => import("./sections/hero.js"),
    init: "initHero",
  },
  {
    selector: "#request-overlay",
    name: "requestPopup",
    load: () => import("./sections/requestPopup.js"),
    init: "initRequestPopup",
  },
  {
    selector: "[data-request-form]",
    name: "requestForms",
    load: () => import("./forms/requestForm.js"),
    init: "initRequestForms",
  },
  {
    selector: "#proam",
    name: "proam",
    load: () => import("./sections/proam.js"),
    init: "initProam",
  },
  {
    selector: "#experience",
    name: "experience",
    load: () => import("./sections/experience.js"),
    init: "initExperience",
  },
  {
    selector: ".testo",
    name: "testo",
    load: () => import("./sections/testo.js"),
    init: "initTesto",
  },
  {
    selector: ".peGallery",
    name: "pastEventsScatter",
    load: () => import("./sections/pastEventsScatter.js"),
    init: "initPastEventsScatter",
  },
  {
    selector: ".spotlight",
    name: "spotlight",
    load: () => import("./sections/spotlight.js"),
    init: "initSpotlight",
  },
  {
    selector: ".koko",
    name: "koko",
    load: () => import("./sections/koko.js"),
    init: "initKoko",
  },
  {
    selector: ".orgSpotlight",
    name: "organizers",
    load: () => import("./sections/organizers.js"),
    init: "initOrganizers",
  },
  {
    selector: ".alessio-page",
    name: "alessio",
    load: () => import("./sections/alessio.js"),
    init: "initAlessio",
  },
  {
    selector: ".rg__gallery",
    name: "radialGallery",
    load: () => import("./sections/radialGallery.js"),
    init: "initRadialGallery",
  },
];

async function initApp() {
  const activeFeatures = features.filter(({ selector }) =>
    document.querySelector(selector)
  );

  // Pinning sections must initialize in document order so later triggers
  // measure against the final spacer geometry created by earlier sections.
  for (const { name, load, init } of activeFeatures) {
    await safeInit(name, async () => {
      const module = await load();
      return module[init]?.();
    });
  }

  requestAnimationFrame(() => {
    document.documentElement.dataset.animationsReady = "true";
    window.dispatchEvent(new Event("site:animations-ready"));
  });
}

if (typeof window !== "undefined") {
  // Run after markup is in place
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initApp, { once: true });
  } else {
    initApp();
  }
}
