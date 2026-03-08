/** Reusable circular SVG progress indicator */
interface Props {
    pct: number        // 0–100
    size?: number      // px
    stroke?: number    // px
    color?: string
    label?: string
}

export default function CircularProgress({ pct, size = 120, stroke = 10, color = '#3b82f6', label }: Props) {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const offset = c - (pct / 100) * c

    return (
        <div
            className="circular-progress"
            style={{ width: size, height: size }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label ? `${label}: ${pct}%` : `Progress: ${pct}%`}
        >
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke="var(--track-color)"
                    strokeWidth={stroke}
                />
                {/* Fill */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            {/* Centre label */}
            <div style={{
                position: 'absolute',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: size * 0.22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {pct}%
                </span>
                {label && <span style={{ fontSize: size * 0.09, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</span>}
            </div>
        </div>
    )
}
