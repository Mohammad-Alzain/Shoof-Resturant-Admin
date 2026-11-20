import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandLogo } from "@/components/common/Brand";
import { GazeStage, type GazeApi } from "./GazeStage";

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
/** Where the caret sits in a text field, in client coordinates: the eyes read along as the user types. */
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
 * The stage: the Shoof gaze watching the sign-in. It follows the pointer, reads along in the field being typed in,
 * shuts its eyes for the password (and looks away if the password is shown), looks around while the server checks,
 * shakes its head at an error and blinks now and then. Driven from the form's DOM, so every auth page gets it for free.
 */
function useGazeDirector(form: React.RefObject<HTMLElement | null>, gaze: React.RefObject<GazeApi | null>) {
  const [mood, setMood] = useState<Mood>("idle");

  useEffect(() => {
    const root = form.current;
    if (!root) return;
    let holding = false;
    let stopThinking: (() => void) | null = null;
    let thinkTimer = 0;

    const fieldOf = (el: Element | null): HTMLInputElement | null => {
      if (el instanceof HTMLInputElement) return el;
      // the show/hide password button sits beside its input
      return el?.closest("div")?.querySelector("input") ?? null;
    };

    const evaluate = () => {
      const active = document.activeElement;
      if (!active || !root.contains(active)) {
        holding = false;
        gaze.current?.close(false);
        setMood((m) => (m === "error" || m === "checking" ? m : "idle"));
        return;
      }
      const input = fieldOf(active);
      if (!input) return;
      if (input.type === "password") input.dataset.secret = "1";
      holding = true;
      if (input.type === "password") {
        gaze.current?.close(true);
        setMood("secret");
      } else if (input.dataset.secret) {
        // the password is shown: eyes open, looking politely away
        gaze.current?.close(false);
        gaze.current?.look(getDirection() === "rtl" ? 0.8 : -0.8, -1);
        setMood("looking_away");
      } else {
        gaze.current?.close(false);
        const p = caretPoint(input);
        gaze.current?.lookAt(p.x, p.y);
        setMood("reading");
      }
    };

    const onFocus = () => requestAnimationFrame(evaluate);
    const onInput = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.type !== "password" && !t.dataset.secret) {
        const p = caretPoint(t);
        gaze.current?.lookAt(p.x, p.y);
      }
    };
    const onClick = () => requestAnimationFrame(evaluate);
    const onPointer = (e: PointerEvent) => {
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
    // an error appears in the form: stop looking around, shake the head
    const observer = new MutationObserver(() => {
      const failed = root.querySelector('[role="alert"], [aria-invalid="true"]');
      if (failed) {
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

    // a blink every few seconds keeps the gaze alive
    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        gaze.current?.blink();
        scheduleBlink();
      }, 3500 + Math.random() * 4000);
    };
    scheduleBlink();
    // a field may already hold focus (autoFocus) before these listeners exist
    const first = requestAnimationFrame(evaluate);

    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onFocus);
    root.addEventListener("input", onInput);
    root.addEventListener("keyup", onInput);
    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit, true);
    window.addEventListener("pointermove", onPointer);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(first);
      stopThinking?.();
      window.clearTimeout(thinkTimer);
      window.clearTimeout(blinkTimer);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onFocus);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keyup", onInput);
      root.removeEventListener("click", onClick);
      root.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [form, gaze]);

  return mood;
}

/** Sign-in: the watching gaze on warm sand beside the form on ivory. Mirrored in RTL; the mark itself never mirrors. */
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
  const mood = useGazeDirector(formArea, gaze);

  return (
    <div dir={getDirection()} className="auth-light auth-screen grid bg-[#FBF5E9] text-[#261C1A] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside aria-hidden className="auth-stage relative flex flex-col items-center justify-center overflow-hidden bg-linear-to-b from-[#F3EADC] to-[#E9DDCF] px-6 py-6 lg:sticky lg:top-0 lg:order-last lg:px-12">
        <GazeStage ref={gaze} lid="#F0E6D7" className="w-[200px] sm:w-[280px] lg:w-[min(80%,560px)]" />

        <div className="mt-4 text-center lg:mt-14">
          <p className="hidden font-display text-[clamp(2.5rem,3.4vw,4rem)] font-semibold leading-[1.1] lg:block rtl:leading-[1.27]">{t("stage_headline")}</p>
          <p key={mood} className="gaze-hint text-base text-[#261C1A]/75 lg:mt-4 lg:text-lg">
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
