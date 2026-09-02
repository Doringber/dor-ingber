"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FallbackPlane } from "@/components/fallback-plane";
import { NoteDock } from "@/components/note-dock";
import { YoutubePlayer } from "@/components/youtube-player";
import { hasWebGPU } from "@/lib/gpu/detect";
import { clamp } from "@/lib/gpu/math";
import { SpatialRenderer, snapDolly, stationKey } from "@/lib/gpu/renderer";
import {
  firstNoteIndex,
  LOOK_CLAMP_RAD,
  MOBILE_QUERY,
  REDUCED_MOTION_QUERY,
  stationLabel,
  type NoteStation,
  type SpatialStation,
} from "@/lib/stations";

type SpatialHomeProps = {
  stations: SpatialStation[];
};

type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
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

export function SpatialHome({ stations }: SpatialHomeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SpatialRenderer | null>(null);
  const playerLayerRef = useRef<HTMLDivElement>(null);
  const dollyRef = useRef(0);
  const targetRef = useRef(0);
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const pointerRef = useRef({
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
    down: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startDolly: 0,
  });
  const playingRef = useRef<string | null>(null);
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dockSlug, setDockSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playerRect, setPlayerRect] = useState<ScreenRect | null>(null);

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
  const showHtmlPlane = !gpuReady || (frozen && !gpuReady);
  const playingStation =
    current?.kind === "film" && playingId === current.youtubeId ? current : null;

  const goTo = useCallback(
    (next: number, immediate = false) => {
      const clamped = clamp(next, 0, last);
      targetRef.current = clamped;
      if (immediate || reducedRef.current) {
        dollyRef.current = clamped;
      }
      setUserIndex(clamped);
      setPlayingId(null);
      setPlayerRect(null);
    },
    [last],
  );

  const openNote = useCallback((slug: string) => {
    setDockSlug(slug);
    setMenuOpen(false);
    setPlayingId(null);
  }, []);

  useEffect(() => {
    reducedRef.current = reducedMotion;
    mobileRef.current = mobile;
    gpuRef.current = gpuReady;
    playingRef.current = playingId;
    indexRef.current = index;
    targetRef.current = index;
  }, [gpuReady, index, mobile, playingId, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasWebGPU()) {
      setGpuTried(true);
      setGpuReady(false);
      return;
    }

    let cancelled = false;
    const renderer = new SpatialRenderer();
    rendererRef.current = renderer;

    void renderer.init(canvas).then(async (ok) => {
      if (cancelled) {
        renderer.dispose();
        return;
      }
      setGpuTried(true);
      if (!ok) {
        setGpuReady(false);
        return;
      }
      await renderer.setStations(stations);
      if (cancelled) {
        renderer.dispose();
        return;
      }
      setGpuReady(true);
    });

    return () => {
      cancelled = true;
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [stations]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !gpuReady) {
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      const reduced = reducedRef.current;
      const isMobile = mobileRef.current;
      if (!reduced) {
        dollyRef.current = dollyRef.current + (targetRef.current - dollyRef.current) * 0.08;
      } else {
        dollyRef.current = targetRef.current;
        lookRef.current.yaw = 0;
        lookRef.current.pitch = 0;
      }

      const focused = snapDolly(dollyRef.current, stations.length);
      const focusedStation = stations[focused];
      if (focused !== indexRef.current) {
        indexRef.current = focused;
        setUserIndex(focused);
        if (playingRef.current) {
          setPlayingId(null);
        }
      }

      const hidden =
        playingRef.current && focusedStation?.kind === "film"
          ? stationKey(focusedStation)
          : null;

      renderer.setDrive({
        mouse: [pointerRef.current.x, pointerRef.current.y],
        velocity: [pointerRef.current.vx, pointerRef.current.vy],
        scroll: dollyRef.current,
        time: reduced ? 0 : now / 1000,
      });
      renderer.setView({
        dolly: reduced ? focused : dollyRef.current,
        yaw: isMobile || reduced ? 0 : lookRef.current.yaw,
        pitch: isMobile || reduced ? 0 : lookRef.current.pitch,
        focused,
        onePlane: isMobile || reduced,
        hiddenId: hidden,
      });
      renderer.frame();

      if (playingRef.current && focusedStation?.kind === "film") {
        const quad = renderer.project(focusedStation.index);
        const layer = playerLayerRef.current;
        if (quad && layer) {
          layer.style.left = `${quad.x}px`;
          layer.style.top = `${quad.y}px`;
          layer.style.width = `${quad.width}px`;
          layer.style.height = `${quad.height}px`;
        }
      }

      pointerRef.current.vx *= 0.86;
      pointerRef.current.vy *= 0.86;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [gpuReady, stations]);

  useEffect(() => {
    if (frozen || !gpuReady) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (dockSlug) {
        return;
      }
      event.preventDefault();
      targetRef.current = clamp(
        targetRef.current + event.deltaY * 0.0032,
        0,
        last,
      );
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [dockSlug, frozen, gpuReady, last]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDockSlug(null);
        setMenuOpen(false);
        setPlayingId(null);
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
    if (
      dockSlug ||
      (event.target instanceof Element &&
        event.target.closest("button, a, .note-dock, .plane-player"))
    ) {
      return;
    }
    const pointer = pointerRef.current;
    pointer.down = true;
    pointer.dragging = false;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.startDolly = targetRef.current;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    updateLook(event.clientX, event.clientY);
    const pointer = pointerRef.current;
    if (!pointer.down || dockSlug) {
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
    if (mobileRef.current || !gpuRef.current || reducedRef.current) {
      return;
    }
    targetRef.current = clamp(pointer.startDolly + dy / 260, 0, last);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    const dx = event.clientX - pointer.startX;
    const wasDragging = pointer.dragging;
    pointer.down = false;
    pointer.dragging = false;

    if (dockSlug) {
      return;
    }

    if ((mobile || frozen || !gpuReady) && wasDragging && Math.abs(dx) > 40) {
      goTo(Math.round(targetRef.current) + (dx < 0 ? 1 : -1));
      return;
    }

    if (wasDragging) {
      goTo(Math.round(targetRef.current));
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest("button, a, .note-dock, .plane-player, .fallback-plane")
    ) {
      return;
    }

    const renderer = rendererRef.current;
    let hit = index;
    if (renderer && gpuReady) {
      const picked = renderer.pick(event.clientX, event.clientY);
      if (picked !== null) {
        hit = picked;
      }
    }

    if (hit !== index) {
      goTo(hit);
      return;
    }

    const station = stations[hit];
    if (!station) {
      return;
    }
    if (station.kind === "film") {
      setPlayingId(station.youtubeId);
      if (renderer && gpuReady) {
        const quad = renderer.project(station.index);
        if (quad) {
          setPlayerRect({
            x: quad.x,
            y: quad.y,
            width: quad.width,
            height: quad.height,
          });
        }
      }
      return;
    }
    openNote(station.slug);
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
      className={`spatial-root${onePlane ? " is-one-plane" : ""}${gpuReady ? " is-gpu" : " is-fallback"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={canvasRef} className="spatial-canvas" aria-hidden />

      {showHtmlPlane && current ? (
        <div className="fallback-stage">
          <FallbackPlane station={current} onOpenNote={openNote} />
        </div>
      ) : null}

      {gpuReady && playingStation ? (
        <div
          ref={playerLayerRef}
          className="plane-player"
          style={
            playerRect
              ? {
                  left: playerRect.x,
                  top: playerRect.y,
                  width: playerRect.width,
                  height: playerRect.height,
                }
              : undefined
          }
        >
          <YoutubePlayer
            key={playingStation.youtubeId}
            youtubeId={playingStation.youtubeId}
            title={stationLabel(playingStation)}
            autoPlay
          />
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
          <p className="kicker">
            {current?.kind === "note" ? `NOTE · ${current.noteNumber}` : "NOTE"}
          </p>
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
