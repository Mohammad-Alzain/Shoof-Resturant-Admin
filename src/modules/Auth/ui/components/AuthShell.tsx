import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "@/helpers/asset";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandLogo } from "@/components/common/Brand";
import { GazeStage, type GazeApi } from "./GazeStage";

/** Real dishes, photographed from above (public/images/login/CREDITS.md). */
const DISHES = [
  { key: "dish_hummus", src: "images/login/dishes/hummus.webp" },
  { key: "dish_shakshuka", src: "images/login/dishes/shakshuka.webp" },
  { key: "dish_salad", src: "images/login/dishes/salad.webp" },
  { key: "dish_ravioli", src: "images/login/dishes/ravioli.webp" },
] as const;
const DISH_EVERY = 5200;

type Mood = "idle" | "reading" | "secret" | "looking_away" | "checking" | "error";

const HINT: Record<Mood, string> = {
  idle: "gaze_idle",
  reading: "gaze_reading",
  secret: "gaze_secret",
  looking_away: "gaze_looking_away",
  checking: "gaze_checking",
  error: "gaze_error",
};

let measureCtx: CanvasRenderingContext2D | null = null;
/** Where the caret sits in a text field, in client coordinates: the eye reads along as the user types. */
function caretPoint(input: HTMLInputElement) {
  const r = input.getBoundingClientRect();
  const cs = getComputedStyle(input);
  measureCtx ??= document.createElement("canvas").getContext("2d");
  let w = 0;
  if (measureCtx) {
    measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    w = measureCtx.measureText(input.value.slice(0, input.selectionStart ?? input.value.length)).width;
  }
  const padS = parseFloat(cs.paddingInlineStart) || 12;
  const inner = Math.min(w, r.width - padS * 2);
  const x = cs.direction === "rtl" ? r.right - padS - inner : r.left + padS + inner;
  return { x, y: r.top + r.height / 2 };
}

/**
 * Directs the stage from the form's DOM, so every auth page gets it for free. The dish plate changes every few seconds
 * and the eye glances at each new dish; otherwise the eye follows the pointer, reads along in the field being typed in,
 * closes for the password (and looks away if it is shown), looks around while the server checks, shakes its head at an
 * error and blinks now and then.
 */
function useStageDirector(form: React.RefObject<HTMLElement | null>, gaze: React.RefObject<GazeApi | null>) {
  const [mood, setMood] = useState<Mood>("idle");
  const [dish, setDish] = useState(0);

  useEffect(() => {
    const root = form.current;
    if (!root) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let holding = false;
    let secret = false;
    let stopThinking: (() => void) | null = null;
    let thinkTimer = 0;
    let glanceTimer = 0;
    let lastPointer = { x: 0, y: 0, at: 0 };

    const fieldOf = (el: Element | null): HTMLInputElement | null => {
      if (el instanceof HTMLInputElement) return el;
      return el?.closest("div")?.querySelector("input") ?? null; // the show/hide button sits beside its input
    };

    const evaluate = () => {
      const active = document.activeElement;
      if (!active || !root.contains(active)) {
        holding = false;
        secret = false;
        gaze.current?.close(false);
        setMood((m) => (m === "error" || m === "checking" ? m : "idle"));
        return;
      }
      const input = fieldOf(active);
      if (!input) return;
      if (input.type === "password") input.dataset.secret = "1";
      secret = Boolean(input.dataset.secret);
      holding = true;
      if (input.type === "password") {
        gaze.current?.close(true);
        setMood("secret");
      } else if (input.dataset.secret) {
        gaze.current?.close(false);
        gaze.current?.look(0.6, -1); // shown password: eye open, looking politely away
        setMood("looking_away");
      } else {
        gaze.current?.close(false);
        const p = caretPoint(input);
        gaze.current?.lookAt(p.x, p.y);
        setMood("reading");
      }
    };

    const onFocus = () => window.setTimeout(evaluate, 0); // after focusout, activeElement settles on the next task
    const onInput = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.type !== "password" && !t.dataset.secret) {
        const p = caretPoint(t);
        gaze.current?.lookAt(p.x, p.y);
      }
    };
    const onPointer = (e: PointerEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY, at: performance.now() };
      if (!holding) gaze.current?.lookAt(e.clientX, e.clientY);
    };
    const onSubmit = () => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      holding = true;
      gaze.current?.close(false);
      stopThinking?.();
      stopThinking = gaze.current?.think() ?? null;
      setMood("checking");
      window.clearTimeout(thinkTimer);
      thinkTimer = window.setTimeout(() => {
        stopThinking?.();
        holding = false;
        setMood((m) => (m === "checking" ? "idle" : m));
      }, 2400);
    };
    const observer = new MutationObserver(() => {
      if (root.querySelector('[role="alert"], [aria-invalid="true"]')) {
        stopThinking?.();
        window.clearTimeout(thinkTimer);
        holding = false;
        gaze.current?.look(0, 0.3);
        gaze.current?.shake();
        setMood("error");
      } else {
        setMood((m) => (m === "error" ? "idle" : m));
      }
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-invalid", "type"] });

    // a new dish on the plate; the eye glances over at it unless it is busy with the password
    const cycle = still
      ? 0
      : window.setInterval(() => {
          if (document.hidden) return;
          setDish((d) => (d + 1) % DISHES.length);
          if (secret) return;
          gaze.current?.glanceAtDish();
          window.clearTimeout(glanceTimer);
          glanceTimer = window.setTimeout(() => {
            const focused = fieldOf(document.activeElement);
            if (holding && focused && root.contains(focused)) evaluate();
            else if (lastPointer.at) gaze.current?.lookAt(lastPointer.x, lastPointer.y);
            else gaze.current?.look(0, 0);
          }, 1300);
        }, DISH_EVERY);

    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        gaze.current?.blink();
        scheduleBlink();
      }, 3500 + Math.random() * 4000);
    };
    scheduleBlink();
    const first = window.setTimeout(evaluate, 0); // autoFocus may have happened before these listeners

    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onFocus);
    root.addEventListener("input", onInput);
    root.addEventListener("keyup", onInput);
    root.addEventListener("click", onFocus);
    root.addEventListener("submit", onSubmit, true);
    window.addEventListener("pointermove", onPointer);
    return () => {
      observer.disconnect();
      window.clearTimeout(first);
      window.clearInterval(cycle);
      stopThinking?.();
      [thinkTimer, glanceTimer, blinkTimer].forEach((t) => window.clearTimeout(t));
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onFocus);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keyup", onInput);
      root.removeEventListener("click", onFocus);
      root.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [form, gaze]);

  return { mood, dish };
}

/**
 * Sign-in. The stage: the dish of the moment, blown up and softened behind a dining-light wash, and in front of it the
 * mark made literal (a real dish in the first plate, the watching eye in the second) under «قبل أول لقمة.».
 * The form sits on warm ivory with the official logo. Mirrored in RTL; the mark itself never mirrors.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const gaze = useRef<GazeApi>(null);
  const formArea = useRef<HTMLElement>(null);
  const { mood, dish } = useStageDirector(formArea, gaze);
  const srcs = DISHES.map((d) => asset(d.src));

  return (
    <div dir={getDirection()} className="auth-light auth-screen grid bg-[#FBF5E9] text-[#261C1A] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside aria-hidden className="auth-stage relative flex flex-col items-center justify-center overflow-hidden bg-[#261C1A] px-6 pb-6 pt-8 text-[#FBF5E9] lg:sticky lg:top-0 lg:order-last lg:px-12 lg:py-0">
        {/* the real dish, large and soft, behind everything */}
        {srcs.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            className="absolute inset-0 size-full scale-110 object-cover blur-[3px] transition-opacity duration-1000 ease-out motion-reduce:transition-none"
            style={{ opacity: i === dish ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-b from-[#541F2D]/72 via-[#3d1620]/60 to-[#261C1A]/90" />

        <GazeStage ref={gaze} dishes={srcs} current={dish} className="relative w-[230px] sm:w-[300px] lg:w-[min(78%,540px)]" />

        <div className="relative mt-5 text-center lg:mt-14">
          <p className="mb-3 hidden h-7 lg:block">
            <span key={dish} className="gaze-hint inline-flex items-center gap-2 rounded-full border border-[#FBF5E9]/25 px-3 py-1 text-sm text-[#E9DDCF]">
              <span className="size-1.5 rounded-full bg-[#B95035]" />
              {t(DISHES[dish].key)}
            </span>
          </p>
          <p className="hidden font-display text-[clamp(2.5rem,3.4vw,4rem)] font-semibold leading-[1.1] lg:block rtl:leading-[1.27]">{t("stage_headline")}</p>
          <p key={mood} className="gaze-hint text-base text-[#E9DDCF] lg:mt-4 lg:text-lg">
            {t(HINT[mood])}
          </p>
        </div>
      </aside>

      <div className="flex min-h-full flex-col px-6 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between gap-4 py-5 lg:py-8">
          <div className="flex items-center gap-4">
            <BrandLogo gaze className="h-9 text-[#541F2D]" />
            <span aria-hidden className="h-6 w-px bg-[#261C1A]/15" />
            <span className="text-sm font-medium text-[#261C1A]/70">{t("console_for_restaurants")}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <main ref={formArea} className="flex flex-1 items-start justify-center pb-16 pt-6 lg:items-center lg:pb-24 lg:pt-0">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-[2rem] font-semibold leading-tight lg:text-[2.5rem] rtl:leading-[1.35]">{title}</h1>
            {description && <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
