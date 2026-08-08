import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function initSpotlight() {
  const spotlightSection = document.querySelector(".spotlight");
  if (!spotlightSection) return; // IMPORTANT: don't run on other pages
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    spotlightSection.classList.add("is-static");
    return;
  }

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const projectIndex = document.querySelector("#spotlightIndex");
  const projectImgs = document.querySelectorAll(".spotlight__imgWrap");
  const projectImagesContainer = document.querySelector(".spotlight__images");
  const projectNames = document.querySelectorAll(
    ".spotlight__names .spotlight__name"
  );
  const projectNamesContainer = document.querySelector(".spotlight__names");
  const totalProjectCount = projectNames.length;

  // If any are missing, bail instead of crashing the whole app.js
  if (
    !projectIndex ||
    !projectImagesContainer ||
    !projectNamesContainer ||
    !projectImgs.length ||
    !totalProjectCount
  ) {
    return;
  }

  const spotlightSectionHeight = spotlightSection.offsetHeight;
  const spotlightSectionPadding = parseFloat(
    getComputedStyle(spotlightSection).padding
  );
  const projectIndexHeight = projectIndex.offsetHeight;
  const containerHeight = projectNamesContainer.offsetHeight;
  const imagesHeight = projectImagesContainer.offsetHeight;

  const moveDistanceIndex =
    spotlightSectionHeight - spotlightSectionPadding * 2 - projectIndexHeight;
  const moveDistanceNames =
    spotlightSectionHeight - spotlightSectionPadding * 2 - containerHeight;
  const moveDistanceImages = window.innerHeight - imagesHeight;

  const imgActivationThreshold = window.innerHeight / 2;

  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: `+=${window.innerHeight * 5}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;

      const currentIndex = Math.min(
        Math.floor(progress * totalProjectCount) + 1,
        totalProjectCount
      );

      projectIndex.textContent = `${String(currentIndex).padStart(2, "0")}/${String(
        totalProjectCount
      ).padStart(2, "0")}`;

      gsap.set(projectIndex, {
        y: progress * moveDistanceIndex,
      });

      gsap.set(projectImagesContainer, {
        y: progress * moveDistanceImages,
      });

      projectImgs.forEach((img) => {
        const imgRect = img.getBoundingClientRect();
        const imgTop = imgRect.top;
        const imgBottom = imgRect.bottom;

        gsap.set(img, {
          opacity:
            imgTop <= imgActivationThreshold && imgBottom >= imgActivationThreshold
              ? 1
              : 0.5,
        });
      });

      projectNames.forEach((p, index) => {
        const startProgress = index / totalProjectCount;
        const endProgress = (index + 1) / totalProjectCount;

        const projectProgress = Math.max(
          0,
          Math.min(1, (progress - startProgress) / (endProgress - startProgress))
        );

        gsap.set(p, {
          y: -projectProgress * moveDistanceNames,
        });

        gsap.set(p, {
          color: projectProgress > 0 && projectProgress < 1 ? "#fff" : "#4a4a4a",
        });
      });
    },
  });

  // Ensure correct measurements after images load
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
