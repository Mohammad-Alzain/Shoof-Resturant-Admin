import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useTransform, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/** Exponential ease-out: the house curve for every entrance (identity: reveal 650-820ms, calm, never bouncy). */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Container that staggers its `Item` children in as it scrolls into view. */
const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function Stagger({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.div className={className} variants={container(stagger, delay)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -8% 0px" }}>
      {children}
    </motion.div>
  );
}

export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Single element that fades up when it enters the viewport. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up from 0 once it is visible. Falls back to the final value with reduced motion. */
export function CountUp({ value, className, duration = 1.1 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const still = false; // counting up is feedback, not decoration
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    if (!inView) return;
    if (still) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, value, still, duration, mv]);
  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </motion.span>
  );
}
