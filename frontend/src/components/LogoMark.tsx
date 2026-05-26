export default function LogoMark({ size = 28 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Outer ring */}
            <circle cx="16" cy="16" r="14" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" />
            {/* Inner pulse */}
            <circle cx="16" cy="16" r="5" fill="url(#logoGrad)" />
            {/* Signal arcs */}
            <path d="M8 16a8 8 0 0 1 8-8" stroke="#00F2FE" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M24 16a8 8 0 0 1-8 8" stroke="#9B51E0" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#00F2FE" />
                    <stop offset="1" stopColor="#9B51E0" />
                </linearGradient>
            </defs>
        </svg>
    )
}
