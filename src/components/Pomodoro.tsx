import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useUI } from "../store/useUI";

type Phase = "work" | "break" | "longBreak";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  break: "Break",
  longBreak: "Long break",
};

const pad = (n: number) => n.toString().padStart(2, "0");

export default function Pomodoro() {
  const cfg = useStore((s) => s.settings.pomodoro);
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
  const tick = useRef<number | null>(null);

  const advance = useCallback(() => {
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

  // Command-palette toggle.
  useEffect(() => {
    if (pomodoroSignal > 0) setRunning((r) => !r);
  }, [pomodoroSignal]);

  const reset = () => {
    setRunning(false);
    setRemaining(phaseLen(phase));
  };
  const skip = () => advance();

  const total = phaseLen(phase);
  const pct = total === 0 ? 0 : 1 - remaining / total;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Pomodoro</h2>
        <span className="text-xs text-muted">
          {PHASE_LABEL[phase]} · {completed} done
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="tabular-nums text-4xl font-semibold tracking-tight">
          {pad(Math.floor(remaining / 60))}:{pad(remaining % 60)}
        </div>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{
                width: `${pct * 100}%`,
                background:
                  phase === "work"
                    ? "var(--color-accent)"
                    : "var(--color-accent-2)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          {running ? "Pause" : "Start"}
        </button>
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
      </div>
    </section>
  );
}
