import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../store/useStore";
import { useUI } from "../store/useUI";

type Phase = "work" | "break" | "longBreak";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  break: "Break",
  longBreak: "Long break",
};

const MIN = 5;
const MAX = 90;
const STEP = 5;

const pad = (n: number) => n.toString().padStart(2, "0");

export default function Pomodoro() {
  const cfg = useStore((s) => s.settings.pomodoro);
  const updateSettings = useStore((s) => s.updateSettings);
  const pomodoroSignal = useUI((s) => s.pomodoroSignal);

  const phaseLen = useCallback(
    (p: Phase) =>
      (p === "work" ? cfg.work : p === "break" ? cfg.break : cfg.longBreak) * 60,
    [cfg],
  );

  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(() => cfg.work * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0); // finished work sessions
  // Whether the magnified focus overlay is showing. Independent of `running`
  // so pausing keeps it up — only the minimize button / Esc closes it.
  const [focusActive, setFocusActive] = useState(false);
  const tick = useRef<number | null>(null);
  const runningRef = useRef(running);
  // True once the current phase has started counting — so pausing keeps its
  // remaining time and only an untouched idle timer re-seeds on duration change.
  const started = useRef(false);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const advance = useCallback(() => {
    started.current = false;
    setPhase((prev) => {
      if (prev === "work") {
        const next = completed + 1;
        setCompleted(next);
        const nextPhase: Phase =
          next % cfg.longBreakEvery === 0 ? "longBreak" : "break";
        setRemaining(phaseLen(nextPhase));
        return nextPhase;
      }
      setRemaining(phaseLen("work"));
      return "work";
    });
    setRunning(false);
  }, [completed, cfg.longBreakEvery, phaseLen]);

  // Countdown loop.
  useEffect(() => {
    if (!running) return;
    started.current = true;
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Defer phase change out of the setState updater.
          queueMicrotask(advance);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running, advance]);

  // Re-seed an idle, untouched timer when durations change (e.g. from Settings).
  useEffect(() => {
    if (!running && !started.current) setRemaining(phaseLen(phase));
  }, [phaseLen, phase, running]);

  // Command-palette toggle: start/pause, entering focus mode on start.
  useEffect(() => {
    if (pomodoroSignal > 0) {
      if (!runningRef.current && cfg.focusMode) setFocusActive(true);
      setRunning((r) => !r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroSignal]);

  const toggleRun = () => {
    if (!running && cfg.focusMode) setFocusActive(true);
    setRunning((r) => !r);
  };

  const reset = () => {
    started.current = false;
    setRunning(false);
    setRemaining(phaseLen(phase));
  };
  const skip = () => advance();

  const changeDuration = (delta: number) => {
    const cur = phase === "work" ? cfg.work : phase === "break" ? cfg.break : cfg.longBreak;
    const next = Math.min(MAX, Math.max(MIN, cur + delta));
    if (next === cur) return;
    updateSettings({ pomodoro: { ...cfg, [phase]: next } });
    if (!running) {
      started.current = false;
      setRemaining(next * 60);
    }
  };

  const total = phaseLen(phase);
  const pct = total === 0 ? 0 : 1 - remaining / total;
  const accent = phase === "work" ? "var(--color-accent)" : "var(--color-accent-2)";
  const timeText = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`;
  const showAdjust = !running;
  const inSession = running || remaining < total;
  const overlayOpen = focusActive && cfg.focusMode;
  const glow = running && !overlayOpen; // running but not magnified → highlight the card

  // Esc closes the focus overlay (back to the inline card).
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  const startPauseBtn = (
    <button
      onClick={toggleRun}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 ${
        running ? "bg-accent-2" : "bg-accent"
      }`}
    >
      {running ? "Pause" : "Start"}
    </button>
  );
  const secondaryBtns = (
    <>
      <button
        onClick={reset}
        className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
      >
        Reset
      </button>
      <button
        onClick={skip}
        className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
      >
        Skip
      </button>
    </>
  );

  return (
    <section
      className="rounded-xl border bg-surface p-4 transition-shadow duration-300"
      style={
        glow
          ? { borderColor: accent, boxShadow: `0 0 22px -4px ${accent}` }
          : { borderColor: "var(--color-border)" }
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Pomodoro</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {PHASE_LABEL[phase]} · {completed} done
          </span>
          {cfg.focusMode && !overlayOpen && inSession && (
            <button
              onClick={() => setFocusActive(true)}
              aria-label="Expand to focus mode"
              title="Focus mode"
              className="text-muted hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showAdjust && (
          <button
            onClick={() => changeDuration(-STEP)}
            aria-label="Decrease minutes"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-lg leading-none text-muted hover:text-fg"
          >
            −
          </button>
        )}
        <div className="tabular-nums text-4xl font-semibold tracking-tight">
          {timeText}
        </div>
        {showAdjust && (
          <button
            onClick={() => changeDuration(STEP)}
            aria-label="Increase minutes"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-lg leading-none text-muted hover:text-fg"
          >
            +
          </button>
        )}
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct * 100}%`, background: accent }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {startPauseBtn}
        {secondaryBtns}
      </div>

      {overlayOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg/90 backdrop-blur-sm">
            <button
              onClick={() => setFocusActive(false)}
              aria-label="Minimize focus mode"
              title="Minimize (Esc)"
              className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <span className="text-sm uppercase tracking-[0.3em] text-muted">
              {PHASE_LABEL[phase]}
              {!running && " · paused"}
            </span>
            <div
              className="tabular-nums text-[6rem] font-semibold leading-none tracking-tight sm:text-[9rem]"
              style={{ color: accent }}
            >
              {timeText}
            </div>
            <div className="h-1.5 w-72 max-w-[80vw] overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${pct * 100}%`, background: accent }}
              />
            </div>
            <div className="flex w-72 max-w-[80vw] gap-2">
              {startPauseBtn}
              {secondaryBtns}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
