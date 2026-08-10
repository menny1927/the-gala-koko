import gsap from "gsap";
import { interiors } from "../../data/interiors.js";

const mobileQuery = "(max-width: 767px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function initRadialGallery() {
  const cursor = document.querySelector(".rg__cursor");
  const gallery = document.querySelector(".rg__gallery");
  if (!cursor || !gallery) return;

  const items = interiors.map((interior, index) => {
    const item = document.createElement("button");
    item.className = "rg__item";
    item.type = "button";
    item.setAttribute("aria-label", `Preview ${interior.name}`);

    const thumb = document.createElement("img");
    thumb.className = "rg__thumb";
    thumb.src = `/assets/img${index + 1}.webp`;
    thumb.alt = "";
    thumb.loading = "lazy";
    thumb.decoding = "async";

    const label = document.createElement("span");
    label.className = "rg__label";
    label.textContent = interior.name;

    const count = document.createElement("span");
    count.className = "rg__count";
    count.textContent = `(${String(index + 1).padStart(2, "0")})`;

    item.append(thumb, label, count);
    gallery.appendChild(item);

    const showPreview = () => {
      if (isStaticMode()) return;
      cursor.replaceChildren();

      const image = document.createElement("img");
      image.src = `/assets/img${index + 1}.webp`;
      image.alt = "";
      cursor.appendChild(image);
      gsap.fromTo(
        image,
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0 0 0 0)", duration: 0.45, ease: "power3.out" }
      );
    };

    const hidePreview = () => {
      const image = cursor.querySelector("img");
      if (!image) return;
      gsap.to(image, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => image.remove(),
      });
    };

    item.addEventListener("mouseenter", showPreview);
    item.addEventListener("focus", showPreview);
    item.addEventListener("mouseleave", hidePreview);
    item.addEventListener("blur", hidePreview);

    return item;
  });

  let frame = 0;
  let scrollRotation = 0;

  function isStaticMode() {
    return (
      window.matchMedia(mobileQuery).matches ||
      window.matchMedia(reducedMotionQuery).matches
    );
  }

  function layoutItems() {
    const staticMode = isStaticMode();
    gallery.classList.toggle("is-static", staticMode);
    cursor.hidden = staticMode;

    if (staticMode) {
      items.forEach((item) => gsap.set(item, { clearProps: "x,y,rotation" }));
      return;
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.78;
    const increment = (Math.PI * 2) / items.length;

    items.forEach((item, index) => {
      const angle = index * increment + scrollRotation;
      gsap.set(item, {
        xPercent: -50,
        yPercent: -50,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        rotation: (angle * 180) / Math.PI + 90,
      });
    });
  }

  function requestLayout() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      scrollRotation = window.scrollY * 0.00016;
      layoutItems();
    });
  }

  function moveCursor(event) {
    if (isStaticMode()) return;
    gsap.to(cursor, {
      x: event.clientX - 150,
      y: event.clientY - 200,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  layoutItems();
  window.addEventListener("scroll", requestLayout, { passive: true });
  window.addEventListener("resize", requestLayout, { passive: true });
  window.addEventListener("pointermove", moveCursor, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", requestLayout);
    window.removeEventListener("resize", requestLayout);
    window.removeEventListener("pointermove", moveCursor);
  };
}
