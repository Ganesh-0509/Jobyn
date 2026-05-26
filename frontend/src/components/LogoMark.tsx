export default function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            {/* The sweeping 'C' loop (Terracotta) */}
            <path
                d="M24 8C20.5 5 15.5 5 12 8C7.5 11.5 7.5 18.5 12 22C15.5 25 20.5 25 24 22"
                stroke="#C2593F"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* The interlocking 'S' loop (Deep Spruce Teal) */}
            <path
                d="M14 12C16.5 12 18.5 13.5 18.5 15.5C18.5 18 13.5 18.5 13.5 21C13.5 23 15.5 24.5 18 24.5"
                stroke="#0F766E"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Connective dots */}
            <circle cx="24" cy="8" r="1.8" fill="#C2593F" />
            <circle cx="18" cy="24.5" r="1.8" fill="#0F766E" />
        </svg>
    )
}
