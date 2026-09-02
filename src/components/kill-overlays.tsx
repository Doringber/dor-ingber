"use client";

import { useEffect } from "react";

const OVERLAYS = [
  "#netlify-drawer",
  "#netlify-drawer-root",
  "#netlify-badge",
  ".netlify-badge",
  "[data-netlify-drawer]",
  "iframe[src*='netlify-cdp']",
  "iframe[src*='netlify-drawer']",
  "iframe[title*='Netlify']",
].join(",");

export function KillOverlays() {
  useEffect(() => {
    const kill = () => {
      document.querySelectorAll(OVERLAYS).forEach((node) => {
        node.remove();
      });
    };

    kill();
    const observer = new MutationObserver(kill);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
