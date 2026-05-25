/**
 * Reusable loading & error state components for page content.
 */

interface LoadingProps {
    message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '40vh', gap: 16,
        }}>
            <div className="spinner" />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message}</p>
        </div>
    )
}

interface ErrorProps {
    title?: string
    message?: string
    onRetry?: () => void
}

export function ErrorState({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    onRetry,
}: ErrorProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '40vh', gap: 12, textAlign: 'center',
            padding: '0 24px',
        }}>
            <div style={{ fontSize: 48 }}>😵</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
                {message}
            </p>
            {onRetry && (
                <button type="button" className="btn btn--primary" onClick={onRetry} style={{ marginTop: 8 }}>
                    Try Again
                </button>
            )}
        </div>
    )
}

interface EmptyProps {
    icon?: string
    title: string
    subtitle?: string
    action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📭', title, subtitle, action }: EmptyProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '30vh', gap: 10, textAlign: 'center',
            padding: '0 24px',
        }}>
            <div style={{ fontSize: 48 }}>{icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
                    {subtitle}
                </p>
            )}
            {action && (
                <button type="button" className="btn btn--primary" onClick={action.onClick} style={{ marginTop: 8 }}>
                    {action.label}
                </button>
            )}
        </div>
    )
}
