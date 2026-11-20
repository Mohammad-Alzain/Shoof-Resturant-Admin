import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * The menu laid on the table around the gaze: dishes seen from above, drawn in the mark's own line language
 * (round caps, plates as rings). Quiet at rest; the dish the eyes are looking at lights up and shows its name.
 * Each dish carries `data-dish` so the gaze director can find where it sits on the page.
 */

const STROKE = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Plate({ r = 52, children }: { r?: number; children: ReactNode }) {
  return (
    <>
      <circle cx="60" cy="60" r={r} {...STROKE} strokeWidth="3.2" />
      <circle cx="60" cy="60" r={r - 11} {...STROKE} strokeWidth="1.4" opacity=".55" />
      {children}
    </>
  );
}

const DISHES: { key: string; art: ReactNode }[] = [
  {
    key: "dish_soup",
    art: (
      <Plate>
        <circle cx="60" cy="60" r="27" fill="currentColor" opacity=".14" />
        <circle cx="60" cy="60" r="27" {...STROKE} strokeWidth="2.4" />
        {[[52, 52], [66, 56], [58, 68], [70, 66], [50, 64]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill="currentColor" />)}
        <path d="M93 27 116 4" {...STROKE} strokeWidth="3.2" />
      </Plate>
    ),
  },
  {
    key: "dish_fattoush",
    art: (
      <Plate>
        {[[48, 48, -30], [70, 50, 25], [58, 72, 80], [44, 66, 120], [72, 70, -60], [60, 40, 5]].map(([x, y, a]) => (
          <ellipse key={`${x}${y}`} cx={x} cy={y} rx="11" ry="5" transform={`rotate(${a} ${x} ${y})`} {...STROKE} strokeWidth="2.2" />
        ))}
        {[[60, 58], [52, 60], [66, 62]].map(([x, y]) => <circle key={`t${x}${y}`} cx={x} cy={y} r="3.2" fill="currentColor" />)}
      </Plate>
    ),
  },
  {
    key: "dish_grill",
    art: (
      <Plate>
        <path d="M24 46 96 68M24 66 96 88" {...STROKE} strokeWidth="1.6" opacity=".7" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={`a${i}`} x={33 + i * 15} y={45 + i * 4.6} width="11" height="8" rx="3.5" transform={`rotate(17 ${38 + i * 15} ${49 + i * 4.6})`} {...STROKE} strokeWidth="2.4" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={`b${i}`} x={30 + i * 15} y={64 + i * 4.6} width="11" height="8" rx="3.5" transform={`rotate(17 ${35 + i * 15} ${68 + i * 4.6})`} fill="currentColor" opacity=".8" />
        ))}
      </Plate>
    ),
  },
  {
    key: "dish_ravioli",
    art: (
      <Plate>
        {[[44, 46], [70, 48], [56, 70]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <rect x={x - 10} y={y - 10} width="20" height="20" rx="4" {...STROKE} strokeWidth="2.2" strokeDasharray="3 2.4" />
            <circle cx={x} cy={y} r="5" fill="currentColor" opacity=".55" />
          </g>
        ))}
      </Plate>
    ),
  },
  {
    key: "dish_manakish",
    art: (
      <>
        <circle cx="60" cy="60" r="48" {...STROKE} strokeWidth="3.2" />
        <circle cx="60" cy="60" r="41" {...STROKE} strokeWidth="1.2" strokeDasharray="1 5" />
        {Array.from({ length: 22 }, (_, i) => {
          const a = i * 2.4;
          const d = 6 + (i % 6) * 5.4;
          return <circle key={i} cx={60 + Math.cos(a) * d} cy={60 + Math.sin(a) * d} r="1.9" fill="currentColor" />;
        })}
      </>
    ),
  },
  {
    key: "dish_coffee",
    art: (
      <>
        <circle cx="56" cy="62" r="34" {...STROKE} strokeWidth="2.6" />
        <circle cx="56" cy="62" r="21" {...STROKE} strokeWidth="3.2" />
        <circle cx="56" cy="62" r="14" fill="currentColor" opacity=".7" />
        <path d="M77 56c9 0 13 4 13 7s-4 7-13 7" {...STROKE} strokeWidth="3.2" />
      </>
    ),
  },
  {
    key: "dish_dessert",
    art: (
      <Plate r={46}>
        <path d="M40 76 60 34 82 74Z" {...STROKE} strokeWidth="2.6" />
        <path d="M44 68 79 67" {...STROKE} strokeWidth="1.4" opacity=".7" />
        {[[60, 46], [67, 58], [54, 60]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.8" fill="currentColor" />)}
      </Plate>
    ),
  },
];

/** Where each dish sits on the stage (percent of the stage), set around the gaze and clear of the copy. */
const SPOTS = [
  { x: 17, y: 13, s: 1 },
  { x: 83, y: 12, s: 1.05 },
  { x: 9, y: 46, s: 0.95 },
  { x: 91, y: 44, s: 1 },
  { x: 15, y: 85, s: 1.05 },
  { x: 50, y: 7, s: 0.7 },
  { x: 86, y: 84, s: 0.9 },
];

export function MenuTable({ active, className }: { active: number | null; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      {DISHES.map((d, i) => {
        const spot = SPOTS[i];
        const on = active === i;
        return (
          <div
            key={d.key}
            data-dish={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `clamp(64px, ${7.6 * spot.s}vw, ${140 * spot.s}px)` }}
          >
            <svg
              viewBox="0 0 120 120"
              className={cn(
                "w-full transition-[color,opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                on ? "scale-110 text-[#B95035] opacity-100" : "text-[#541F2D] opacity-25",
              )}
            >
              {d.art}
            </svg>
            <span
              className={cn(
                "mt-2 whitespace-nowrap rounded-full bg-[#FBF5E9]/90 px-2.5 py-0.5 text-xs font-medium text-[#261C1A] transition-[opacity,transform] duration-300 motion-reduce:transition-none",
                on ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              )}
            >
              {t(d.key)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const DISH_COUNT = DISHES.length;
