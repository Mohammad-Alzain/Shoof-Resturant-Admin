import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Shoof identity (public/identity): two plates seen from above, each with a pupil that looks at the dish
 * ("the tasting gaze"). This file is the only place the logo is drawn; every screen imports from here.
 */

const PLATE_L = { cx: 23, cy: 46, r: 15 };
const PLATE_R = { cx: 63, cy: 46, r: 15 };
const PUPIL_L = { cx: 27, cy: 43.5, r: 3.3 };
const PUPIL_R = { cx: 67, cy: 43.5, r: 3.3 };
/** The compact icon, centred in a 32 box. */
const FIT = "translate(16 16.4) scale(0.345) translate(-43 -46)";

/** App icon tile in Shoof's own colours (burgundy tile, ivory plates), whatever the console theme. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("brand-mark size-9", className)} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--brand-burgundy)" />
      <g transform={FIT} fill="none" stroke="var(--brand-ivory)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <circle {...PLATE_L} />
        <circle {...PLATE_R} />
      </g>
      <g className="brand-mark-pupils" transform={FIT} fill="var(--brand-ivory)">
        <circle {...PUPIL_L} />
        <circle {...PUPIL_R} />
      </g>
    </svg>
  );
}

/** The "Shoof" wordmark as drawn paths (never set in a UI font), coloured by `currentColor`. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 6 205 65" className={cn("h-5 w-auto", className)} role="img" aria-label="Shoof" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
        <path d="M39 19C33 13 26 11 18 13C10 15 7 19 7 25C7 32 13 35 23 38C33 41 40 44 40 51C40 60 32 64 23 64C15 64 9 61 4 56" />
        <path d="M54 12V63M54 43C56 34 62 29 70 29C79 29 84 34 84 43V63" />
        <path d="M185 63V25C185 16 190 12 199 12M177 31H198" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="6.6" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="110" cy="46" r="17" />
        <circle cx="154" cy="46" r="17" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
        <path d="M100 47a10.5 10.5 0 0 0 8 9" />
        <path d="M144 47a10.5 10.5 0 0 0 8 9" />
      </g>
      <g fill="currentColor">
        <circle cx="114" cy="42.5" r="2.9" />
        <circle cx="158" cy="42.5" r="2.9" />
      </g>
    </svg>
  );
}

/** Mark + wordmark lockup. */
export function BrandLockup({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <Wordmark className="h-[18px]" />
    </span>
  );
}

/**
 * Loading indicator in the brand's own language: the plates sit still, the pupils look around the table
 * (left, up and to the right, back to centre), the way the logo's gaze does. Replaces spinners and the old placeholder logo.
 */
export function GazeLoader({ className, label }: { className?: string; label?: string }) {
  const still = useReducedMotion();
  const look = { x: [0, -5, 4, 4, 0], y: [0, 1, -3, -3, 0] };
  const t = { duration: 2.4, repeat: Infinity, ease: [0.16, 1, 0.3, 1] as const, times: [0, 0.25, 0.55, 0.8, 1] };
  return (
    <svg viewBox="0 22 86 48" className={cn("h-14 w-auto text-brand-ink", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <motion.g
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        animate={still ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "43px 46px" }}
      >
        <circle {...PLATE_L} />
        <circle {...PLATE_R} />
      </motion.g>
      <motion.g fill="currentColor" animate={still ? undefined : look} transition={t}>
        <circle {...PUPIL_L} />
        <circle {...PUPIL_R} />
      </motion.g>
    </svg>
  );
}
