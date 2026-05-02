import { useId } from 'react'

type LogoMarkProps = {
    size?: number
    className?: string
}

export default function LogoMark({ size = 36, className }: LogoMarkProps) {
    const gradientId = useId()

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            role="img"
            aria-label="CampusSync logo"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2d6a4f" />
                    <stop offset="55%" stopColor="#3d8b6a" />
                    <stop offset="100%" stopColor="#d4a017" />
                </linearGradient>
                <radialGradient id={`${gradientId}-glow`} cx="0.3" cy="0.2" r="0.9">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="32" r="30" fill={`url(#${gradientId}-glow)`} />
            <path
                d="M36 10L18 34H30L26 54L46 28H34L36 10Z"
                fill="#1b3a2a"
                stroke="#f4f7f2"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <circle cx="48" cy="18" r="4" fill="#d4a017" opacity="0.9" />
        </svg>
    )
}
