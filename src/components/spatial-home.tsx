"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { NoteDock } from "@/components/note-dock";
import { StationPlane } from "@/components/station-plane";
import { stationAtScreenPoint } from "@/lib/hits";
import { hasWebGPU } from "@/lib/gpu/detect";
import { clamp } from "@/lib/gpu/math";
import { startVolume } from "@/lib/gpu/volume";
import {
  firstNoteIndex,
  LOOK_CLAMP_RAD,
  MOBILE_QUERY,
  REDUCED_MOTION_QUERY,
  snapDolly,
  stationKicker,
  type NoteStation,
  type SpatialStation,
} from "@/lib/stations";

type SpatialHomeProps = {
  stations: SpatialStation[];
};

const WORLD = 150;

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
    Boolean(
      target.closest(
        "iframe, .note-dock, .spatial-chrome button, .mobile-menu",
      ),
    )
  );
}

export function SpatialHome({ stations }: SpatialHomeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
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
  const gpuRef = useRef(false);

  const reducedMotion = useMedia(REDUCED_MOTION_QUERY);
  const mobile = useMedia(MOBILE_QUERY);
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const hashIndex = indexFromHash(stations, hash);
  const [gpuReady, setGpuReady] = useState(false);
  const [gpuTried, setGpuTried] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const index = userIndex ?? hashIndex;
  const [dockSlug, setDockSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const dockSlugRef = useRef<string | null>(null);
  const swipeLockRef = useRef(0);
  const touchSwipeRef = useRef({ active: false, x: 0, y: 0 });

  const last = Math.max(stations.length - 1, 0);
  const current = stations[index] ?? stations[0];
  const dockNote = useMemo(
    () =>
      stations.find(
        (station): station is NoteStation =>
          station.kind === "note" && station.slug === dockSlug,
      ) ?? null,
    [dockSlug, stations],
  );
  const frozen = reducedMotion || (gpuTried && !gpuReady);
  const onePlane = mobile || frozen;
  const showVolumeStations = gpuReady && !onePlane;

  const setFocusedIndex = useCallback((next: number) => {
    setUserIndex(next);
    setPlayingId((id) => (id === next ? id : null));
  }, []);

  const goTo = useCallback(
    (next: number, immediate = false) => {
      const clamped = clamp(next, 0, last);
      targetRef.current = clamped;
      if (immediate || reducedRef.current) {
        dollyRef.current = clamped;
      }
      setFocusedIndex(clamped);
    },
    [last, setFocusedIndex],
  );

  const openNote = useCallback((slug: string) => {
    setDockSlug(slug);
    setMenuOpen(false);
  }, []);

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

  const applyHorizontalSwipe = useCallback((dx: number, dy: number) => {
    if (Math.abs(dx) <= 40 || Math.abs(dx) < Math.abs(dy)) {
      return false;
    }
    const now = performance.now();
    if (now - swipeLockRef.current < 350) {
      return false;
    }
    swipeLockRef.current = now;
    goTo(indexRef.current + (dx < 0 ? 1 : -1));
    return true;
  }, [goTo]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
    mobileRef.current = mobile;
    gpuRef.current = gpuReady;
    indexRef.current = index;
    targetRef.current = index;
    dockSlugRef.current = dockSlug;
  }, [dockSlug, gpuReady, index, mobile, reducedMotion]);

  useEffect(() => {
    if (!onePlane) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      if (dockSlugRef.current || isChromeTarget(event.target)) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchSwipeRef.current = { active: true, x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const swipe = touchSwipeRef.current;
      if (!swipe.active) {
        return;
      }
      swipe.active = false;
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      applyHorizontalSwipe(touch.clientX - swipe.x, touch.clientY - swipe.y);
    };

    const onTouchCancel = () => {
      touchSwipeRef.current.active = false;
    };

    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true });
    window.addEventListener("touchcancel", onTouchCancel, { capture: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchCancel, true);
    };
  }, [applyHorizontalSwipe, onePlane]);

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
    const tick = () => {
      const reduced = reducedRef.current;
      if (!reduced) {
        dollyRef.current += (targetRef.current - dollyRef.current) * 0.08;
      } else {
        dollyRef.current = targetRef.current;
        lookRef.current.yaw = 0;
        lookRef.current.pitch = 0;
      }

      const focused = snapDolly(dollyRef.current, stations.length);
      if (focused !== indexRef.current) {
        indexRef.current = focused;
        setFocusedIndex(focused);
      }

      const world = worldRef.current;
      if (world && gpuRef.current && !mobileRef.current && !reduced) {
        const yaw = (lookRef.current.yaw * 180) / Math.PI;
        const pitch = (lookRef.current.pitch * 180) / Math.PI;
        world.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg) translate3d(0px, 36px, ${-dollyRef.current * 220}px)`;
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
      if (dockSlug) {
        return;
      }
      event.preventDefault();
      targetRef.current = clamp(targetRef.current + event.deltaY * 0.0032, 0, last);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [dockSlug, frozen, last]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDockSlug(null);
        setMenuOpen(false);
        return;
      }
      if (dockSlug) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        goTo(Math.round(targetRef.current) + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        goTo(Math.round(targetRef.current) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dockSlug, goTo]);

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

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (dockSlug || isChromeTarget(event.target)) {
      return;
    }
    const pointer = pointerRef.current;
    pointer.down = true;
    pointer.dragging = false;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.startDolly = targetRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const touchLike = event.pointerType === "touch" || mobileRef.current || onePlane;
    if (!touchLike) {
      updateLook(event.clientX, event.clientY);
    }
    const pointer = pointerRef.current;
    if (!pointer.down || dockSlug) {
      return;
    }
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (Math.hypot(dx, dy) > 8) {
      pointer.dragging = true;
    }
    if (!pointer.dragging || touchLike) {
      return;
    }
    targetRef.current = clamp(pointer.startDolly + dy / 260, 0, last);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const wasDragging = pointer.dragging;
    const wasDown = pointer.down;
    pointer.down = false;
    pointer.dragging = false;

    if (dockSlug || !wasDown) {
      return;
    }

    if (onePlane && wasDragging && applyHorizontalSwipe(dx, dy)) {
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
      goTo(hit);
      return;
    }
    activate(station);
  };

  const navTo = (nextHash: "#work" | "#writing") => {
    setMenuOpen(false);
    setDockSlug(null);
    setUserIndex(null);
    window.location.hash = nextHash;
    goTo(indexFromHash(stations, nextHash), true);
  };

  return (
    <main
      ref={rootRef}
      className={`spatial-root${onePlane ? " is-one-plane" : ""}${gpuReady ? " is-gpu" : " is-fallback"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={canvasRef} className="spatial-canvas" aria-hidden />

      {showVolumeStations ? (
        <div className="volume-stage">
          <div ref={worldRef} className="volume-world">
            {stations.map((station) => (
              <div
                key={`${station.kind}-${station.index}`}
                data-station={station.index}
                className={`volume-station${station.index === index ? " is-focused" : ""}`}
                style={{
                  width: station.size[0] * WORLD,
                  height: station.size[1] * WORLD,
                  transform: `translate3d(${station.position[0] * WORLD}px, ${-station.position[1] * WORLD}px, ${station.position[2] * WORLD}px) translate(-50%, -50%)`,
                }}
              >
                <StationPlane
                  station={station}
                  resetKey={`${station.kind}-${station.index}-${station.index === index}`}
                  playing={playingId === station.index}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!showVolumeStations && current ? (
        <div className="fallback-stage">
          <div
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
                goTo(index - 1);
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
                goTo(index + 1);
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

      {dockNote ? <NoteDock note={dockNote} onClose={() => setDockSlug(null)} /> : null}
    </main>
  );
}
