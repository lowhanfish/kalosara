"use client";

import { useEffect } from "react";

/** Delegate to public cards so async content receives the same interaction. */
export function CardEffects() {
  useEffect(() => {
    const media = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let active: HTMLElement | null = null;
    let frame = 0;
    const reset = () => {
      if (!active) return;
      active.style.removeProperty("--card-rx");
      active.style.removeProperty("--card-ry");
      active.style.removeProperty("--card-x");
      active.style.removeProperty("--card-y");
      active.removeAttribute("data-tilting");
      active = null;
    };
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      if (!media.matches || event.pointerType !== "mouse") {
        reset();
        return;
      }
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".public-portal .portal-card")
          : null;
      if (target !== active) {
        reset();
        active = target;
      }
      if (!target) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        const box = target.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (clientY - box.top) / box.height));
        target.style.setProperty("--card-rx", `${(0.5 - y) * 5}deg`);
        target.style.setProperty("--card-ry", `${(x - 0.5) * 6}deg`);
        target.style.setProperty("--card-x", `${x * 100}%`);
        target.style.setProperty("--card-y", `${y * 100}%`);
        target.setAttribute("data-tilting", "true");
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      reset();
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    media.addEventListener("change", leave);
    return () => {
      leave();
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      media.removeEventListener("change", leave);
    };
  }, []);
  return null;
}
