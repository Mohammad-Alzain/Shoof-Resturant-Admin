import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The Shoof mark at stage scale: two plates seen from above, each with a pupil (shoof-plate-icon.svg geometry,
 * scaled ×100/17: plate r 100, rim 38.8, inner rim 11, pupil r 17 sitting 23.5 right and 20.6 up of centre).
 * The pupils move within the brand book's gaze limits (±5 / ±4 source units → ±29 / ±23.5 here).
 * An ivory lid can slide down to the plate's centre line: the plates themselves never change.
 */

const VB = { w: 560, h: 300 };
const EYES = [
  { cx: 160, cy: 150 },
  { cx: 400, cy: 150 },
] as const;
const R = 100;
const RIM = 38.8;
const INNER = R - RIM / 2; // the plate's open centre
const PUPIL = { dx: 23.5, dy: -20.6, r: 17 };
const LIMIT = { x: 29, y: 23.5 };
const LID_OPEN = -(INNER + 8);

export interface GazeApi {
  /** Look at a point on the page (client coordinates). */
  lookAt: (x: number, y: number) => void;
  /** Pupils to a direction in limit units (-1..1). */
  look: (x: number, y: number) => void;
  close: (closed: boolean) => void;
  blink: () => void;
  shake: () => void;
  /** Look around while something is being checked; returns a stop function. */
  think: () => () => void;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const GazeStage = forwardRef<GazeApi, { className?: string; color?: string; lid?: string }>(function GazeStage(
  { className, color = "#541F2D", lid = "#F3EADC" },
  ref,
) {
  const svg = useRef<SVGSVGElement>(null);
  const head = useRef<SVGGElement>(null);
  const pupils = useRef<(SVGGElement | null)[]>([]);
  const lids = useRef<(SVGGElement | null)[]>([]);
  const closed = useRef(false);

  const setPupils = (ox: number, oy: number) => {
    pupils.current.forEach((p) => p && (p.style.transform = `translate(${ox}px, ${oy}px)`));
  };
  const setLids = (shut: boolean) => {
    lids.current.forEach((l) => l && (l.style.transform = `translateY(${shut ? 0 : LID_OPEN}px)`));
  };

  useImperativeHandle(ref, () => {
    const api: GazeApi = {
      lookAt(x, y) {
        const el = svg.current;
        if (!el || closed.current) return;
        const b = el.getBoundingClientRect();
        if (!b.width) return;
        const s = b.width / VB.w;
        // aim from the point between the eyes so both pupils move together, like the logo's gaze
        const cx = b.left + (VB.w / 2) * s;
        const cy = b.top + EYES[0].cy * s;
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / (260 * s + 120));
        api.look((dx / d) * reach, (dy / d) * reach);
      },
      look(x, y) {
        setPupils(Math.max(-1, Math.min(1, x)) * LIMIT.x, Math.max(-1, Math.min(1, y)) * LIMIT.y);
      },
      close(shut) {
        closed.current = shut;
        if (shut) setPupils(0, 0);
        setLids(shut);
      },
      blink() {
        if (closed.current || reduced()) return;
        setLids(true);
        window.setTimeout(() => !closed.current && setLids(false), 130);
      },
      shake() {
        if (reduced()) return;
        head.current?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-16px)" }, { transform: "translateX(13px)" }, { transform: "translateX(-8px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
          { duration: 520, easing: "cubic-bezier(.36,.07,.19,.97)" },
        );
      },
      think() {
        if (reduced()) return () => {};
        const path: [number, number][] = [[-0.9, 0.2], [0.2, -0.9], [0.9, -0.3], [0.1, 0.6]];
        let i = 0;
        api.look(...path[0]);
        const id = window.setInterval(() => api.look(...path[++i % path.length]), 380);
        return () => window.clearInterval(id);
      },
    };
    return api;
  }, []);

  // pupils and lids ease like the brand book's gaze (220ms); reduced motion jumps without animating
  useEffect(() => {
    const ease = reduced() ? "none" : "transform 220ms cubic-bezier(.2,.8,.25,1)";
    pupils.current.forEach((p) => p && (p.style.transition = ease));
    lids.current.forEach((l) => l && (l.style.transition = reduced() ? "none" : "transform 160ms cubic-bezier(.4,0,.2,1)"));
    setLids(false);
  }, []);

  return (
    <svg ref={svg} viewBox={`0 0 ${VB.w} ${VB.h}`} className={cn("block", className)} aria-hidden="true" focusable="false">
      <defs>
        {EYES.map((e, i) => (
          <clipPath key={i} id={`gaze-eye-${i}`}>
            <circle cx={e.cx} cy={e.cy} r={INNER} />
          </clipPath>
        ))}
      </defs>
      <g ref={head}>
        {EYES.map((e, i) => (
          <g key={i}>
            <g ref={(n) => void (pupils.current[i] = n)}>
              <circle cx={e.cx + PUPIL.dx} cy={e.cy + PUPIL.dy} r={PUPIL.r} fill={color} />
            </g>
            {/* the lid: ivory from above, its lash line stopping on the plate's centre line */}
            <g clipPath={`url(#gaze-eye-${i})`}>
              <g ref={(n) => void (lids.current[i] = n)} style={{ transform: `translateY(${LID_OPEN}px)` }}>
                <rect x={e.cx - INNER} y={e.cy - INNER - 4} width={INNER * 2} height={INNER + 4} fill={lid} />
                <path d={`M${e.cx - INNER} ${e.cy}h${INNER * 2}`} stroke={color} strokeWidth={11} strokeLinecap="round" />
              </g>
            </g>
            <circle cx={e.cx} cy={e.cy} r={R} fill="none" stroke={color} strokeWidth={RIM} />
            <path d={`M${e.cx - 58.8} ${e.cy + 5.9}a61.8 61.8 0 0 0 47.1 52.9`} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  );
});
