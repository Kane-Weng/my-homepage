interface Props {
  done: number;
  total: number;
  size?: number;
}

/** SVG donut that fills as today's habits get checked off. */
export default function ProgressRing({ done, total, size = 72 }: Props) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={complete ? "var(--color-accent)" : "var(--color-accent-2)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-sm font-semibold tabular-nums">
          {complete ? "🎉" : `${done}/${total}`}
        </span>
      </div>
    </div>
  );
}
