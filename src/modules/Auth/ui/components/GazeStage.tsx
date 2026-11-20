import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * "Shoof" made literal: the mark's two plates at stage scale (shoof-plate-icon.svg geometry ×100/17), where the first
 * plate holds a real dish, seen from above and turning slowly, and the second is the watching eye. The eye keeps the
 * brand book's gaze limits (±5 / ±4 source units → ±29 / ±23.5 here); an espresso lid can close it down to its
 * centre line. The dishes cross-fade; the eye glances at each new one.
 */

const VB = { w: 560, h: 300 };
const DISH = { cx: 160, cy: 150 };
const EYE = { cx: 400, cy: 150 };
const R = 100;
const RIM = 38.8;
const OUTER = R + RIM / 2; // the dish fills the whole plate
const INNER = R - RIM / 2;
const PUPIL = { dx: 23.5, dy: -20.6, r: 17 };
const LIMIT = { x: 29, y: 23.5 };
const LID_OPEN = -(INNER + 8);

export interface GazeApi {
  lookAt: (x: number, y: number) => void;
  look: (x: number, y: number) => void;
  /** Look across at the dish plate. */
  glanceAtDish: () => void;
  close: (closed: boolean) => void;
  blink: () => void;
  shake: () => void;
  think: () => () => void;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const GazeStage = forwardRef<
  GazeApi,
  { className?: string; dishes: string[]; current: number; ring?: string; well?: string }
>(function GazeStage({ className, dishes, current, ring = "#FBF5E9", well = "#261C1A" }, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const head = useRef<SVGGElement>(null);
  const pupil = useRef<SVGGElement>(null);
  const lid = useRef<SVGGElement>(null);
  const closed = useRef(false);

  const setPupil = (ox: number, oy: number) => {
    if (pupil.current) pupil.current.style.transform = `translate(${ox}px, ${oy}px)`;
  };
  const setLid = (shut: boolean) => {
    if (lid.current) lid.current.style.transform = `translateY(${shut ? 0 : LID_OPEN}px)`;
  };

  useImperativeHandle(ref, () => {
    const api: GazeApi = {
      lookAt(x, y) {
        const el = svg.current;
        if (!el || closed.current) return;
        const b = el.getBoundingClientRect();
        if (!b.width) return;
        const s = b.width / VB.w;
        const dx = x - (b.left + EYE.cx * s);
        const dy = y - (b.top + EYE.cy * s);
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / (200 * s + 100));
        api.look((dx / d) * reach, (dy / d) * reach);
      },
      look(x, y) {
        setPupil(Math.max(-1, Math.min(1, x)) * LIMIT.x, Math.max(-1, Math.min(1, y)) * LIMIT.y);
      },
      glanceAtDish() {
        if (!closed.current) api.look(-1, 0.15);
      },
      close(shut) {
        closed.current = shut;
        if (shut) setPupil(0, 0);
        setLid(shut);
      },
      blink() {
        if (closed.current || reduced()) return;
        setLid(true);
        window.setTimeout(() => !closed.current && setLid(false), 130);
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
        const path: [number, number][] = [[-1, 0.1], [0.2, -0.9], [0.9, -0.2], [0.1, 0.7]];
        let i = 0;
        api.look(...path[0]);
        const id = window.setInterval(() => api.look(...path[++i % path.length]), 380);
        return () => window.clearInterval(id);
      },
    };
    return api;
  }, []);

  useEffect(() => {
    const still = reduced();
    if (pupil.current) pupil.current.style.transition = still ? "none" : "transform 220ms cubic-bezier(.2,.8,.25,1)";
    if (lid.current) lid.current.style.transition = still ? "none" : "transform 160ms cubic-bezier(.4,0,.2,1)";
    setLid(false);
  }, []);

  return (
    <svg ref={svg} viewBox={`0 0 ${VB.w} ${VB.h}`} className={cn("block overflow-visible", className)} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="gaze-dish">
          <circle cx={DISH.cx} cy={DISH.cy} r={OUTER} />
        </clipPath>
        <clipPath id="gaze-eye">
          <circle cx={EYE.cx} cy={EYE.cy} r={INNER} />
        </clipPath>
        <filter id="gaze-lift" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#140a09" floodOpacity="0.55" />
        </filter>
      </defs>

      <g ref={head}>
        {/* plate one: a real dish, turning slowly, the dishes cross-fading */}
        <g filter="url(#gaze-lift)">
          <circle cx={DISH.cx} cy={DISH.cy} r={OUTER} fill={well} />
          <g clipPath="url(#gaze-dish)">
            <g className="gaze-turntable" style={{ transformOrigin: `${DISH.cx}px ${DISH.cy}px` }}>
              {dishes.map((src, i) => (
                <image
                  key={src}
                  href={src}
                  x={DISH.cx - OUTER}
                  y={DISH.cy - OUTER}
                  width={OUTER * 2}
                  height={OUTER * 2}
                  preserveAspectRatio="xMidYMid slice"
                  className="transition-opacity duration-700 ease-out motion-reduce:transition-none"
                  style={{ opacity: i === current ? 1 : 0 }}
                />
              ))}
            </g>
          </g>
          <circle cx={DISH.cx} cy={DISH.cy} r={OUTER - 2} fill="none" stroke={ring} strokeWidth="4" />
        </g>

        {/* plate two: the watching eye */}
        <g filter="url(#gaze-lift)">
          <circle cx={EYE.cx} cy={EYE.cy} r={OUTER} fill={well} />
          <g ref={pupil}>
            <circle cx={EYE.cx + PUPIL.dx} cy={EYE.cy + PUPIL.dy} r={PUPIL.r} fill={ring} />
          </g>
          <g clipPath="url(#gaze-eye)">
            <g ref={lid} style={{ transform: `translateY(${LID_OPEN}px)` }}>
              <rect x={EYE.cx - INNER} y={EYE.cy - INNER - 4} width={INNER * 2} height={INNER + 4} fill={well} />
              <path d={`M${EYE.cx - INNER} ${EYE.cy}h${INNER * 2}`} stroke={ring} strokeWidth={11} strokeLinecap="round" />
            </g>
          </g>
          <circle cx={EYE.cx} cy={EYE.cy} r={R} fill="none" stroke={ring} strokeWidth={RIM} />
          <path d={`M${EYE.cx - 58.8} ${EYE.cy + 5.9}a61.8 61.8 0 0 0 47.1 52.9`} fill="none" stroke={ring} strokeWidth={11} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
});
