import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STYLE_URL = "/map/tomtom-mono-dark.json";

const KOKO = { lng: -0.1417, lat: 51.5344 };
const ROYAL_ALBERT_HALL = { lng: -0.1774, lat: 51.501 };

// Camera keyframes across the pinned scroll: wide London, then both venues
// framed, then a fly-in to KOKO.
const CAMERA = [
  { at: 0, lng: -0.1596, lat: 51.5177, zoom: 10.8 },
  { at: 0.45, lng: -0.1596, lat: 51.5177, zoom: 12.5 },
  { at: 0.78, lng: KOKO.lng, lat: KOKO.lat, zoom: 14.9 },
  { at: 1, lng: KOKO.lng, lat: KOKO.lat, zoom: 15.7 },
];

const smooth = (x) => x * x * (3 - 2 * x);

const cameraAt = (progress) => {
  let a = CAMERA[0];
  let b = CAMERA[CAMERA.length - 1];

  for (let i = 0; i < CAMERA.length - 1; i += 1) {
    if (progress >= CAMERA[i].at && progress <= CAMERA[i + 1].at) {
      a = CAMERA[i];
      b = CAMERA[i + 1];
      break;
    }
  }

  const span = b.at - a.at;
  const t = span <= 0 ? 0 : smooth((progress - a.at) / span);

  return {
    center: [a.lng + (b.lng - a.lng) * t, a.lat + (b.lat - a.lat) * t],
    zoom: a.zoom + (b.zoom - a.zoom) * t,
  };
};

const buildMarker = (variant, label) => {
  const root = document.createElement("div");
  root.className = `koko-marker koko-marker-${variant}`;
  root.style.opacity = "0";

  const icon = document.createElement("span");
  icon.className = "koko-marker-icon";

  const text = document.createElement("p");
  text.className = "koko-marker-label";
  text.textContent = label;

  root.append(icon, text);
  return root;
};

export async function initKokoLiveMap(koko, mapEl) {
  const key = mapEl.dataset.tomtomKey;
  if (!key) return;

  // maplibre-gl v6 ships named exports only — there is no default export.
  const [maplibregl, style] = await Promise.all([
    import("maplibre-gl"),
    fetch(STYLE_URL).then((response) => response.json()),
  ]);

  const map = new maplibregl.Map({
    container: mapEl,
    style,
    center: [CAMERA[0].lng, CAMERA[0].lat],
    zoom: CAMERA[0].zoom,
    interactive: false, // never swallow page scroll
    attributionControl: false, // we render our own
    fadeDuration: 0,
    transformRequest: (url) => ({
      url: url + (url.includes("?") ? "&" : "?") + `key=${key}`,
    }),
  });

  const kokoMarkerEl = buildMarker(1, "KOKO Theatre");
  const rahMarkerEl = buildMarker(2, "Royal Albert Hall");

  await new Promise((resolve) => map.on("load", resolve));

  // Drop TomTom's own POI pins so they don't sit under ours.
  map.getStyle().layers.forEach(({ id }) => {
    if (/poi/i.test(id) && map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
  });

  new maplibregl.Marker({ element: kokoMarkerEl, anchor: "left" })
    .setLngLat([KOKO.lng, KOKO.lat])
    .addTo(map);
  new maplibregl.Marker({ element: rahMarkerEl, anchor: "left" })
    .setLngLat([ROYAL_ALBERT_HALL.lng, ROYAL_ALBERT_HALL.lat])
    .addTo(map);

  koko.classList.add("is-map-ready");

  const kokoMask = koko.querySelector(".koko-mask");
  const kokoGrid = koko.querySelector(".koko-grid-overlay");
  const kokoContent = koko.querySelector(".koko-content");
  const progressBar = koko.querySelector(".koko-scroll-progress-bar");

  const measure = () => kokoContent.offsetHeight - window.innerHeight;
  let contentMove = measure();

  const fade = (from, to, progress) =>
    gsap.utils.clamp(0, 1, (progress - from) / (to - from));

  const trigger = ScrollTrigger.create({
    trigger: ".koko",
    start: "top top",
    end: () => `+=${window.innerHeight * 4}px`,
    pin: true,
    pinSpacing: true,
    scrub: 0.75,
    invalidateOnRefresh: true,
    onUpdate: ({ progress }) => {
      const { center, zoom } = cameraAt(progress);
      map.jumpTo({ center, zoom });

      gsap.set(progressBar, { "--progress": progress });
      gsap.set(kokoContent, { y: -progress * contentMove });

      // Vignette closes in as the camera settles on KOKO, then opens again.
      let maskScale = 2.5;
      if (progress > 0.4 && progress <= 0.5) maskScale = 2.5 - smooth((progress - 0.4) / 0.1) * 1.5;
      else if (progress > 0.5 && progress <= 0.86) maskScale = 1;
      else if (progress > 0.86) maskScale = 1 + smooth((progress - 0.86) / 0.14) * 1.5;
      gsap.set(kokoMask, { scale: maskScale });

      gsap.set(kokoGrid, {
        opacity: progress <= 0.5 ? fade(0.45, 0.5, progress) : 1 - fade(0.86, 0.94, progress),
      });

      // Royal Albert Hall reads early while the view is wide; KOKO stays lit.
      gsap.set(rahMarkerEl, {
        opacity: progress <= 0.6 ? fade(0.18, 0.26, progress) : 1 - fade(0.6, 0.72, progress),
      });
      gsap.set(kokoMarkerEl, { opacity: fade(0.3, 0.42, progress) });
    },
  });

  const onResize = () => {
    contentMove = measure();
    map.resize();
  };
  window.addEventListener("resize", onResize);

  return () => {
    trigger.kill();
    window.removeEventListener("resize", onResize);
    map.remove();
  };
}
