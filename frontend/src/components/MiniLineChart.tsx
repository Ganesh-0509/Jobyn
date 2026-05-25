/** Minimal SVG line chart - no external dependencies */
interface Point { label: string; value: number }

interface Props {
    data: Point[]
    height?: number
    color?: string
}

export default function MiniLineChart({ data, height = 120, color = '#3b82f6' }: Props) {
    if (!data.length) return null

    const W = 500  // viewBox width (scales with container)
    const H = height
    const PAD = { top: 12, right: 12, bottom: 28, left: 36 }

    const values = data.map(d => d.value)
    const minV = Math.min(...values) - 5
    const maxV = Math.max(...values) + 5
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom

    const xOf = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2)
    const yOf = (v: number) => {
        const range = maxV - minV
        return PAD.top + (range === 0 ? innerH / 2 : (1 - (v - minV) / range) * innerH)
    }

    const pts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`)

    // Y axis labels
    const yTicks = [minV + 5, Math.round((minV + maxV) / 2), maxV - 5]

    return (
        <div style={{ width: '100%' }}>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height, display: 'block' }}
            >
                {/* Grid lines */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line
                            x1={PAD.left} x2={W - PAD.right}
                            y1={yOf(t)} y2={yOf(t)}
                            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                        />
                        <text
                            x={PAD.left - 6} y={yOf(t) + 4}
                            fontSize="10" fill="#4b5563" textAnchor="end"
                        >
                            {Math.round(t)}
                        </text>
                    </g>
                ))}

                {/* Area fill */}
                <polygon
                    points={[
                        ...pts,
                        `${xOf(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`,
                        `${xOf(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`,
                    ].join(' ')}
                    fill={`${color}18`}
                />

                {/* Line */}
                <polyline
                    points={pts.join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={xOf(i)} cy={yOf(d.value)}
                        r="4"
                        fill={color}
                        stroke="#161c2d"
                        strokeWidth="2"
                    />
                ))}

                {/* X labels */}
                {data.map((d, i) => (
                    <text
                        key={i}
                        x={xOf(i)} y={H - 6}
                        fontSize="10" fill="#4b5563" textAnchor="middle"
                    >
                        {d.label}
                    </text>
                ))}
            </svg>
        </div>
    )
}
