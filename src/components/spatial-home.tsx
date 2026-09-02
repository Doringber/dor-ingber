"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { StationPlane } from "@/components/station-plane";
import { stationAtScreenPoint } from "@/lib/hits";
import { noteFromPath, writingPath } from "@/lib/note-reader";
import { hasWebGPU } from "@/lib/gpu/detect";
import { clamp } from "@/lib/gpu/math";
import { startVolume } from "@/lib/gpu/volume";
import {
  focusOpacity,
  stationFrame,
  stationSize,
  stationWorldZ,
  VOLUME_LIFT_PX,
} from "@/lib/scale";
import {
  firstNoteIndex,
  LOOK_CLAMP_RAD,
  MOBILE_QUERY,
  REDUCED_MOTION_QUERY,
  stationKicker,
  type SpatialStation,
} from "@/lib/stations";
import {
  focusedFromDolly,
  incomingDrag,
  indexAfterSwipe,
  shouldCommitSwipe,
  stepSpring,
} from "@/lib/swipe";

type SpatialHomeProps = {
  stations: SpatialStation[];
};

const VIEWPORT_FALLBACK = 1280;

function subscribeMedia(query: string, onChange: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribeMedia(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeViewport(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useViewportWidth(): number {
  return useSyncExternalStore(
    subscribeViewport,
    () => window.innerWidth,
    () => VIEWPORT_FALLBACK,
  );
}

function indexFromHash(stations: SpatialStation[], hash: string): number {
  if (hash === "#writing") {
    return firstNoteIndex(stations);
  }
  return 0;
}

function subscribeHash(onStoreChange: () => void): () => void {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHash(): string {
  return window.location.hash;
}

function getServerHash(): string {
  return "";
}

function isChromeTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest(".note-reader, .spatial-chrome button, .mobile-menu"))
  );
}

export function SpatialHome({ stations }: SpatialHomeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dollyRef = useRef(0);
  const targetRef = useRef(0);
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const pointerRef = useRef({
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    down: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startDolly: 0,
  });
  const indexRef = useRef(0);
  const reducedRef = useRef(false);
  const mobileRef = useRef(false);
  const onePlaneRef = useRef(false);
  const gpuRef = useRef(false);
  const swipeConsumedRef = useRef(false);
  const dragRef = useRef({ x: 0, v: 0, target: 0 });

  const router = useRouter();
  const pathname = usePathname();
  const readerOpen = noteFromPath(pathname) !== null;
  const reducedMotion = useMedia(REDUCED_MOTION_QUERY);
  const mobile = useMedia(MOBILE_QUERY);
  const viewportWidth = useViewportWidth();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const hashIndex = indexFromHash(stations, hash);
  const [gpuReady, setGpuReady] = useState(false);
  const [gpuTried, setGpuTried] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const index = userIndex ?? hashIndex;
  const [menuOpen, setMenuOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const last = Math.max(stations.length - 1, 0);
  const current = stations[index] ?? stations[0];
  const frozen = reducedMotion || (gpuTried && !gpuReady);
  const onePlane = mobile || frozen;
  const showVolumeStations = gpuReady && !onePlane;
  const frames = useMemo(
    () =>
      stations.map((station) =>
        stationFrame(station, station.index === index, viewportWidth, index),
      ),
    [index, stations, viewportWidth],
  );
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const viewportWidthRef = useRef(viewportWidth);
  viewportWidthRef.current = viewportWidth;
  const stationsRef = useRef(stations);
  stationsRef.current = stations;

  const setFocusedIndex = useCallback((next: number) => {
    setUserIndex(next);
    setPlayingId((id) => (id === next ? id : null));
  }, []);

  const goTo = useCallback(
    (next: number, immediate = false) => {
      const clamped = clamp(next, 0, last);
      targetRef.current = clamped;
      if (immediate || reducedRef.current || onePlaneRef.current) {
        dollyRef.current = clamped;
      }
      indexRef.current = clamped;
      setFocusedIndex(clamped);
    },
    [last, setFocusedIndex],
  );

  const springToStation = useCallback(
    (next: number, fromDx = 0) => {
      const clamped = clamp(next, 0, last);
      if (clamped === indexRef.current) {
        dragRef.current.target = 0;
        return;
      }
      if (onePlaneRef.current && !reducedRef.current) {
        dragRef.current.x = fromDx !== 0 ? incomingDrag(fromDx) : incomingDrag(
          clamped > indexRef.current ? -1 : 1,
        );
        dragRef.current.v = 0;
        dragRef.current.target = 0;
      }
      goTo(clamped);
    },
    [goTo, last],
  );

  const openNote = useCallback(
    (slug: string) => {
      setMenuOpen(false);
      router.push(writingPath(slug));
    },
    [router],
  );

  const playStation = useCallback((stationIndex: number) => {
    setPlayingId(stationIndex);
  }, []);

  const openHref = useCallback((href: string) => {
    window.location.assign(href);
  }, []);

  const activate = useCallback(
    (station: SpatialStation) => {
      if (station.kind === "film") {
        playStation(station.index);
        return;
      }
      if (station.kind === "note") {
        openNote(station.slug);
        return;
      }
      openHref(station.href);
    },
    [openHref, openNote, playStation],
  );

  const applyHorizontalSwipe = useCallback(
    (dx: number, dy: number) => {
      if (swipeConsumedRef.current || !shouldCommitSwipe(dx, dy)) {
        return false;
      }
      const next = indexAfterSwipe(indexRef.current, dx, last);
      if (next === indexRef.current) {
        return false;
      }
      swipeConsumedRef.current = true;
      springToStation(next, dx);
      return true;
    },
    [last, springToStation],
  );

  useEffect(() => {
    reducedRef.current = reducedMotion;
    mobileRef.current = mobile;
    onePlaneRef.current = onePlane;
    gpuRef.current = gpuReady;
    indexRef.current = index;
    targetRef.current = index;
    if (onePlane) {
      dollyRef.current = index;
    }
  }, [gpuReady, index, mobile, onePlane, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasWebGPU()) {
      setGpuTried(true);
      setGpuReady(false);
      return;
    }

    return startVolume(
      canvas,
      () => ({
        mouse: [pointerRef.current.x, pointerRef.current.y],
        velocity: [pointerRef.current.vx, pointerRef.current.vy],
        scroll: dollyRef.current,
        time: reducedRef.current ? 0 : performance.now() / 1000,
      }),
      {
        frozen: reducedMotion,
        onReady: (ok) => {
          setGpuTried(true);
          setGpuReady(ok);
        },
      },
    );
  }, [reducedMotion]);

  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;
      const reduced = reducedRef.current;
      const one = onePlaneRef.current;
      if (!reduced) {
        dollyRef.current += (targetRef.current - dollyRef.current) * 0.08;
      } else {
        dollyRef.current = targetRef.current;
        lookRef.current.yaw = 0;
        lookRef.current.pitch = 0;
      }

      const focused = focusedFromDolly(
        dollyRef.current,
        stations.length,
        one,
        indexRef.current,
      );
      if (focused !== indexRef.current) {
        indexRef.current = focused;
        setFocusedIndex(focused);
      }

      const drag = dragRef.current;
      if (!one || reduced) {
        drag.x = 0;
        drag.v = 0;
        drag.target = 0;
      } else {
        const next = stepSpring(drag.x, drag.v, drag.target, dt);
        drag.x = next.pos;
        drag.v = next.vel;
      }
      const stage = stageRef.current;
      if (stage) {
        const settle = Math.abs(drag.x) < 0.2 && Math.abs(drag.v) < 2;
        stage.style.transform = settle
          ? ""
          : `translate3d(${drag.x}px, 0, 0)`;
      }

      const world = worldRef.current;
      if (world && gpuRef.current && !mobileRef.current && !reduced) {
        const yaw = (lookRef.current.yaw * 180) / Math.PI;
        const pitch = (lookRef.current.pitch * 180) / Math.PI;
        world.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg) translate3d(0px, ${VOLUME_LIFT_PX}px, 0px)`;
        const dolly = dollyRef.current;
        const viewport = viewportWidthRef.current;
        for (const node of world.querySelectorAll<HTMLElement>("[data-station]")) {
          const stationIndex = Number(node.dataset.station);
          const frame = framesRef.current[stationIndex];
          const station = stationsRef.current[stationIndex];
          if (!frame || !station || !Number.isFinite(stationIndex)) {
            continue;
          }
          const sized = stationSize(
            viewport,
            stationIndex,
            dolly,
            station.kind === "note",
          );
          node.style.width = `${sized.width}px`;
          node.style.height = `${sized.height}px`;
          node.style.opacity = String(focusOpacity(sized.focus));
          node.style.zIndex = String(Math.round(1 + sized.focus * 10));
          node.style.transform = `translate3d(${frame.x}px, ${frame.y}px, ${stationWorldZ(stationIndex, dolly)}px) translate(-50%, -50%)`;
        }
      }

      pointerRef.current.vx *= 0.86;
      pointerRef.current.vy *= 0.86;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [setFocusedIndex, stations.length]);

  useEffect(() => {
    if (frozen) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (readerOpen) {
        return;
      }
      event.preventDefault();
      targetRef.current = clamp(targetRef.current + event.deltaY * 0.0032, 0, last);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [frozen, last, readerOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        if (readerOpen) {
          router.push("/");
        }
        return;
      }
      if (readerOpen) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        springToStation(Math.round(targetRef.current) + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        springToStation(Math.round(targetRef.current) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readerOpen, router, springToStation]);

  const updateLook = (clientX: number, clientY: number) => {
    const nx = clientX / window.innerWidth;
    const ny = clientY / window.innerHeight;
    const pointer = pointerRef.current;
    pointer.vx = (nx - pointer.x) * 80;
    pointer.vy = (ny - pointer.y) * 80;
    pointer.x = nx;
    pointer.y = ny;
    if (!mobileRef.current && !reducedRef.current && !pointer.down) {
      lookRef.current.yaw = clamp(-(nx * 2 - 1) * LOOK_CLAMP_RAD, -LOOK_CLAMP_RAD, LOOK_CLAMP_RAD);
      lookRef.current.pitch = clamp(
        -(ny * 2 - 1) * LOOK_CLAMP_RAD,
        -LOOK_CLAMP_RAD,
        LOOK_CLAMP_RAD,
      );
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (readerOpen || isChromeTarget(event.target)) {
      return;
    }
    const pointer = pointerRef.current;
    pointer.down = true;
    pointer.dragging = false;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.startDolly = targetRef.current;
    swipeConsumedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const touchLike = event.pointerType === "touch" || mobileRef.current || onePlane;
    if (!touchLike) {
      updateLook(event.clientX, event.clientY);
    }
    const pointer = pointerRef.current;
    if (!pointer.down || readerOpen) {
      return;
    }
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (Math.hypot(dx, dy) > 8) {
      pointer.dragging = true;
    }
    if (!pointer.dragging) {
      return;
    }
    if (onePlaneRef.current) {
      const atStart = indexRef.current <= 0 && dx > 0;
      const atEnd = indexRef.current >= last && dx < 0;
      const resist = atStart || atEnd ? 0.22 : 0.82;
      dragRef.current.target = dx * resist;
      return;
    }
    if (touchLike) {
      return;
    }
    targetRef.current = clamp(pointer.startDolly + dy / 260, 0, last);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const wasDragging = pointer.dragging;
    const wasDown = pointer.down;
    pointer.down = false;
    pointer.dragging = false;

    if (readerOpen || !wasDown) {
      return;
    }

    if (onePlane && wasDragging) {
      if (applyHorizontalSwipe(dx, dy)) {
        return;
      }
      dragRef.current.target = 0;
      return;
    }

    if (wasDragging) {
      goTo(Math.round(targetRef.current));
      return;
    }

    if (isChromeTarget(event.target)) {
      return;
    }

    const fromNode =
      event.target instanceof Element ? event.target.closest("[data-station]") : null;
    const fromScreen = rootRef.current
      ? stationAtScreenPoint(rootRef.current, event.clientX, event.clientY, index)
      : null;
    const hit =
      fromNode instanceof HTMLElement
        ? Number(fromNode.dataset.station)
        : fromScreen;
    if (hit == null || !Number.isFinite(hit)) {
      return;
    }
    const station = stations.find((item) => item.index === hit);
    if (!station) {
      return;
    }
    if (hit !== index) {
      springToStation(hit);
      return;
    }
    activate(station);
  };

  const navTo = (nextHash: "#work" | "#writing") => {
    setMenuOpen(false);
    setUserIndex(null);
    if (readerOpen) {
      router.push(`/${nextHash}`);
    } else {
      window.location.hash = nextHash;
    }
    goTo(indexFromHash(stations, nextHash), true);
  };

  return (
    <main
      ref={rootRef}
      className={`spatial-root${onePlane ? " is-one-plane" : ""}${gpuReady ? " is-gpu" : " is-fallback"}${readerOpen ? " is-reading" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={canvasRef} className="spatial-canvas" aria-hidden />

      {showVolumeStations ? (
        <div className="volume-stage">
          <div ref={worldRef} className="volume-world">
            {stations.map((station) => {
              const frame = frames[station.index] ?? frames[0];
              return (
                <div
                  key={`${station.kind}-${station.index}`}
                  data-station={station.index}
                  className={`volume-station${station.index === index ? " is-focused" : ""}${station.kind === "note" ? " is-note" : ""}`}
                  style={{
                    transform: `translate3d(${frame.x}px, ${frame.y}px, ${frame.z}px) translate(-50%, -50%)`,
                  }}
                >
                  <StationPlane
                    station={station}
                    resetKey={`${station.kind}-${station.index}-${station.index === index}`}
                    playing={playingId === station.index}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!showVolumeStations && current ? (
        <div className="fallback-stage">
          <div
            ref={stageRef}
            data-station={current.index}
            className={`fallback-measure${current.kind === "note" ? " is-note" : ""}`}
          >
            <StationPlane
              station={current}
              resetKey={`${current.kind}-${current.index}`}
              playing={playingId === current.index}
            />
          </div>
        </div>
      ) : null}

      <div className="spatial-chrome">
        <div className="spatial-brand">
          <h1 className="spatial-wordmark">Dor Ingber</h1>
          <p className="spatial-lede">AI films and notes.</p>
          <nav className="spatial-nav desktop-only" aria-label="Primary">
            <button type="button" className="spatial-nav-link tap" onClick={() => navTo("#work")}>
              Work
            </button>
            <button type="button" className="spatial-nav-link tap" onClick={() => navTo("#writing")}>
              Writing
            </button>
          </nav>
        </div>

        <button
          type="button"
          className="burger tap mobile-only"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <span />
          <span />
        </button>

        {menuOpen ? (
          <div className="mobile-menu mobile-only">
            <button type="button" className="spatial-nav-link tap" onClick={() => navTo("#work")}>
              Work
            </button>
            <button type="button" className="spatial-nav-link tap" onClick={() => navTo("#writing")}>
              Writing
            </button>
          </div>
        ) : null}

        <div className="spatial-foot desktop-only">
          drag to look · scroll to move · {gpuReady ? "WebGPU" : "still"}
        </div>

        <div className="mobile-drive mobile-only">
          <p>drag</p>
          <div className="mobile-arrows">
            <button
              type="button"
              className="tap"
              aria-label="Previous station"
              onClick={(event) => {
                event.stopPropagation();
                springToStation(index - 1);
              }}
            >
              ←
            </button>
            <span aria-hidden>—</span>
            <button
              type="button"
              className="tap"
              aria-label="Next station"
              onClick={(event) => {
                event.stopPropagation();
                springToStation(index + 1);
              }}
            >
              →
            </button>
          </div>
        </div>

        <div className="mobile-kicker mobile-only">
          <p className="kicker">{current ? stationKicker(current) : "FILM"}</p>
          <p>
            This site explores spatial stories
            <br />
            through stillness and movement.
          </p>
        </div>
      </div>

    </main>
  );
}
